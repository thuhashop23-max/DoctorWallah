<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminCouponController extends Controller
{
    /**
     * List all coupons with filters and summary analytics
     */
    public function index(Request $request): JsonResponse
    {
        Coupon::ensureTableExists();

        $query = Coupon::with([
            'courses:id,title,price',
            'categories:id,name',
            'restrictedUser:id,name,phone,email',
            'restrictedUsers:id,name,phone,email,role',
            'creator:id,name',
        ])->withCount('usages');

        // Search by code or title
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by discount type
        if ($request->filled('discount_type')) {
            $query->where('discount_type', $request->discount_type);
        }

        // Filter by scope type
        if ($request->filled('scope_type')) {
            $query->where('scope_type', $request->scope_type);
        }

        // Filter by user restriction
        if ($request->filled('user_restriction_type')) {
            $query->where('user_restriction_type', $request->user_restriction_type);
        }

        // Filter by status
        if ($request->filled('status')) {
            $status = $request->status;
            $now = Carbon::now();
            if ($status === 'trashed') {
                $query->onlyTrashed();
            } elseif ($status === 'active') {
                $query->where('is_active', true)
                    ->where(function ($q) use ($now) {
                        $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
                    })
                    ->where(function ($q) use ($now) {
                        $q->whereNull('expiry_date')->orWhere('expiry_date', '>=', $now);
                    });
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($status === 'expired') {
                $query->where('expiry_date', '<', $now);
            }
        } elseif ($request->boolean('trashed')) {
            $query->onlyTrashed();
        }

        $perPage = (int) $request->get('per_page', 15);
        $coupons = $query->latest()->paginate($perPage);

        // Calculate top statistics
        $totalCoupons = Coupon::count();
        $now = Carbon::now();
        $activeCoupons = Coupon::where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('expiry_date')->orWhere('expiry_date', '>=', $now);
            })
            ->count();
        $totalRedemptions = (int) Coupon::sum('times_used');
        $totalDiscountGiven = (float) CouponUsage::sum('discount_amount');

        return response()->json([
            'coupons' => $coupons,
            'stats' => [
                'total_coupons' => $totalCoupons,
                'active_coupons' => $activeCoupons,
                'total_redemptions' => $totalRedemptions,
                'total_discount_given' => $totalDiscountGiven,
                'trashed_coupons' => Coupon::onlyTrashed()->count(),
            ],
        ]);
    }

    /**
     * Create a new coupon
     */
    public function store(Request $request): JsonResponse
    {
        Coupon::ensureTableExists();

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'discount_type' => ['required', 'in:fixed,percentage'],
            'discount_amount' => ['required', 'numeric', 'min:0.01'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'scope_type' => ['required', 'in:all,course,category'],
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['exists:courses,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'user_restriction_type' => ['required', 'in:all,specific'],
            'restricted_user_ids' => ['nullable', 'array'],
            'restricted_user_ids.*' => ['exists:users,id'],
            'restricted_user_id' => [
                'nullable',
                Rule::requiredIf(fn() => $request->user_restriction_type === Coupon::USER_SPECIFIC && empty($request->restricted_user_ids)),
                'exists:users,id',
            ],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (!empty($validated['start_date']) && !empty($validated['expiry_date'])) {
            if (strtotime($validated['expiry_date']) < strtotime($validated['start_date'])) {
                return response()->json([
                    'message' => 'Expiry date must be after or equal to start date.',
                    'errors' => ['expiry_date' => ['Expiry date must be after or equal to start date.']],
                ], 422);
            }
        }

        $code = strtoupper(trim($validated['code']));
        $userIds = $validated['restricted_user_ids'] ?? [];
        if (empty($userIds) && !empty($validated['restricted_user_id'])) {
            $userIds = [(int) $validated['restricted_user_id']];
        }
        $primaryUserId = $userIds[0] ?? null;

        try {
            $coupon = DB::transaction(function () use ($validated, $code, $request, $userIds, $primaryUserId) {
                $coupon = Coupon::create([
                    'code' => $code,
                    'title' => !empty($validated['title']) ? $validated['title'] : $code,
                    'description' => $validated['description'] ?? null,
                    'discount_type' => $validated['discount_type'],
                    'discount_amount' => $validated['discount_amount'],
                    'max_discount_amount' => $validated['max_discount_amount'] ?? null,
                    'min_order_amount' => $validated['min_order_amount'] ?? null,
                    'scope_type' => $validated['scope_type'] ?? 'all',
                    'user_restriction_type' => $validated['user_restriction_type'] ?? 'all',
                    'restricted_user_id' => ($validated['user_restriction_type'] ?? 'all') === Coupon::USER_SPECIFIC ? $primaryUserId : null,
                    'usage_limit' => $validated['usage_limit'] ?? null,
                    'usage_limit_per_user' => !empty($validated['usage_limit_per_user']) ? $validated['usage_limit_per_user'] : 1,
                    'times_used' => 0,
                    'start_date' => $validated['start_date'] ?? null,
                    'expiry_date' => $validated['expiry_date'] ?? null,
                    'is_active' => $validated['is_active'] ?? true,
                    'created_by' => $request->user()?->id ?? auth()->id() ?? null,
                ]);

                // Sync courses if scope is course
                if ($validated['scope_type'] === Coupon::SCOPE_COURSE && !empty($validated['course_ids'])) {
                    $coupon->courses()->sync($validated['course_ids']);
                }

                // Sync categories if scope is category
                if ($validated['scope_type'] === Coupon::SCOPE_CATEGORY && !empty($validated['category_ids'])) {
                    $coupon->categories()->sync($validated['category_ids']);
                }

                // Sync restricted users if user restriction is specific
                if (($validated['user_restriction_type'] ?? 'all') === Coupon::USER_SPECIFIC && !empty($userIds)) {
                    $coupon->restrictedUsers()->sync($userIds);
                }

                return $coupon;
            });

            return response()->json([
                'message' => 'Coupon created successfully!',
                'coupon' => $coupon->load(['courses:id,title', 'categories:id,name', 'restrictedUser:id,name,phone,email', 'restrictedUsers:id,name,phone,email,role']),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to create coupon: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show single coupon details
     */
    public function show($id): JsonResponse
    {
        Coupon::ensureTableExists();

        $coupon = Coupon::with([
            'courses:id,title,price',
            'categories:id,name',
            'restrictedUser:id,name,phone,email',
            'restrictedUsers:id,name,phone,email,role',
            'creator:id,name',
            'usages' => function ($q) {
                $q->with(['user:id,name,phone,email', 'order:id,order_number'])->latest()->limit(20);
            },
        ])->findOrFail($id);

        return response()->json([
            'coupon' => $coupon,
        ]);
    }

    /**
     * Update an existing coupon
     */
    public function update(Request $request, $id): JsonResponse
    {
        Coupon::ensureTableExists();

        $coupon = Coupon::findOrFail($id);

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('coupons', 'code')->ignore($coupon->id)],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'discount_type' => ['required', 'in:fixed,percentage'],
            'discount_amount' => ['required', 'numeric', 'min:0.01'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'scope_type' => ['required', 'in:all,course,category'],
            'course_ids' => ['nullable', 'array'],
            'course_ids.*' => ['exists:courses,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:categories,id'],
            'user_restriction_type' => ['required', 'in:all,specific'],
            'restricted_user_ids' => ['nullable', 'array'],
            'restricted_user_ids.*' => ['exists:users,id'],
            'restricted_user_id' => [
                'nullable',
                Rule::requiredIf(fn() => $request->user_restriction_type === Coupon::USER_SPECIFIC && empty($request->restricted_user_ids)),
                'exists:users,id',
            ],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['nullable', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (!empty($validated['start_date']) && !empty($validated['expiry_date'])) {
            if (strtotime($validated['expiry_date']) < strtotime($validated['start_date'])) {
                return response()->json([
                    'message' => 'Expiry date must be after or equal to start date.',
                    'errors' => ['expiry_date' => ['Expiry date must be after or equal to start date.']],
                ], 422);
            }
        }

        $code = strtoupper(trim($validated['code']));
        $userIds = $validated['restricted_user_ids'] ?? [];
        if (empty($userIds) && !empty($validated['restricted_user_id'])) {
            $userIds = [(int) $validated['restricted_user_id']];
        }
        $primaryUserId = $userIds[0] ?? null;

        try {
            DB::transaction(function () use ($coupon, $validated, $code, $userIds, $primaryUserId) {
                $coupon->update([
                    'code' => $code,
                    'title' => !empty($validated['title']) ? $validated['title'] : ($coupon->title ?: $code),
                    'description' => $validated['description'] ?? null,
                    'discount_type' => $validated['discount_type'],
                    'discount_amount' => $validated['discount_amount'],
                    'max_discount_amount' => $validated['max_discount_amount'] ?? null,
                    'min_order_amount' => $validated['min_order_amount'] ?? null,
                    'scope_type' => $validated['scope_type'] ?? 'all',
                    'user_restriction_type' => $validated['user_restriction_type'] ?? 'all',
                    'restricted_user_id' => ($validated['user_restriction_type'] ?? 'all') === Coupon::USER_SPECIFIC ? $primaryUserId : null,
                    'usage_limit' => $validated['usage_limit'] ?? null,
                    'usage_limit_per_user' => !empty($validated['usage_limit_per_user']) ? $validated['usage_limit_per_user'] : 1,
                    'start_date' => $validated['start_date'] ?? null,
                    'expiry_date' => $validated['expiry_date'] ?? null,
                    'is_active' => $validated['is_active'] ?? $coupon->is_active,
                ]);

                // Sync courses
                if ($validated['scope_type'] === Coupon::SCOPE_COURSE) {
                    $coupon->courses()->sync($validated['course_ids'] ?? []);
                } else {
                    $coupon->courses()->detach();
                }

                // Sync categories
                if ($validated['scope_type'] === Coupon::SCOPE_CATEGORY) {
                    $coupon->categories()->sync($validated['category_ids'] ?? []);
                } else {
                    $coupon->categories()->detach();
                }

                // Sync restricted users
                if (($validated['user_restriction_type'] ?? 'all') === Coupon::USER_SPECIFIC) {
                    $coupon->restrictedUsers()->sync($userIds);
                } else {
                    $coupon->restrictedUsers()->detach();
                }
            });

            return response()->json([
                'message' => 'Coupon updated successfully!',
                'coupon' => $coupon->fresh(['courses:id,title', 'categories:id,name', 'restrictedUser:id,name,phone,email', 'restrictedUsers:id,name,phone,email,role']),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to update coupon: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a coupon
     */
    public function destroy($id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();

        return response()->json([
            'message' => 'Coupon moved to trash. You can restore it if needed.',
        ]);
    }

    public function restore($id): JsonResponse
    {
        $coupon = Coupon::onlyTrashed()->findOrFail($id);
        $coupon->restore();

        return response()->json([
            'message' => 'Coupon restored successfully.',
            'coupon' => $coupon,
        ]);
    }

    public function forceDelete($id): JsonResponse
    {
        $coupon = Coupon::withTrashed()->findOrFail($id);
        $coupon->courses()->detach();
        $coupon->categories()->detach();
        $coupon->restrictedUsers()->detach();
        $coupon->forceDelete();

        return response()->json([
            'message' => 'Coupon permanently deleted.',
        ]);
    }

    /**
     * Toggle coupon active / inactive status
     */
    public function toggleStatus($id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->is_active = !$coupon->is_active;
        $coupon->save();

        return response()->json([
            'message' => $coupon->is_active ? 'Coupon activated!' : 'Coupon deactivated!',
            'is_active' => $coupon->is_active,
        ]);
    }

    /**
     * Live search users by phone number, name or email
     * Specifically fulfills searching by phone number to create a targeted user coupon.
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $q = trim($request->get('q', ''));
        if (strlen($q) < 1) {
            return response()->json(['users' => []]);
        }

        $users = User::where(function ($query) use ($q) {
            $query->where('phone', 'like', "%{$q}%")
                  ->orWhere('name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%");
        })
        ->select(['id', 'name', 'phone', 'email', 'role'])
        ->limit(15)
        ->get();

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Fetch courses and categories for modal dropdowns
     */
    public function getCoursesAndCategories(): JsonResponse
    {
        $courses = Course::select(['id', 'title', 'price', 'sale_price'])
            ->where('status', Course::STATUS_PUBLISHED)
            ->latest()
            ->get();

        $categories = Category::select(['id', 'name', 'slug'])
            ->withCount('courses')
            ->get();

        return response()->json([
            'courses' => $courses,
            'categories' => $categories,
        ]);
    }
}

