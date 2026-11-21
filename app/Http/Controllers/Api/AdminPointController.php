<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PointSetting;
use App\Models\PointTransaction;
use App\Models\RewardNoteSubmission;
use App\Models\User;
use App\Services\PointService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPointController extends Controller
{
    public function getSettings(): JsonResponse
    {
        PointSetting::ensureTableExists();
        PointTransaction::ensureTableExists();
        RewardNoteSubmission::ensureTableExists();

        $settings = PointSetting::getSettings();

        // Calculate summary stats
        $totalPointsAwarded = PointTransaction::where('amount', '>', 0)->sum('amount');
        $totalTransactions = PointTransaction::count();
        $totalApprovedNotes = RewardNoteSubmission::where('status', RewardNoteSubmission::STATUS_APPROVED)->count();
        $totalStudentsWithPoints = User::where('points', '>', 0)->count();

        return response()->json([
            'settings' => $settings,
            'stats' => [
                'total_points_awarded' => (int) $totalPointsAwarded,
                'total_transactions' => (int) $totalTransactions,
                'total_approved_notes' => (int) $totalApprovedNotes,
                'students_with_points' => (int) $totalStudentsWithPoints,
            ],
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        PointSetting::ensureTableExists();

        $validated = $request->validate([
            'purchase_points_enabled' => ['required', 'boolean'],
            'purchase_points_type' => ['required', 'string', 'in:fixed,per_amount'],
            'points_per_course' => ['required', 'integer', 'min:0', 'max:100000'],
            'points_per_100_currency' => ['required', 'integer', 'min:0', 'max:100000'],
            'redemption_enabled' => ['sometimes', 'boolean'],
            'redemption_points' => ['sometimes', 'integer', 'min:1', 'max:100000'],
            'redemption_amount' => ['sometimes', 'numeric', 'min:0.01', 'max:10000'],
            'max_redemption_percentage' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'is_active' => ['required', 'boolean'],
        ]);

        $settings = PointSetting::getSettings();
        $settings->update($validated);

        return response()->json([
            'message' => 'Point settings updated successfully.',
            'settings' => $settings->fresh(),
        ]);
    }

    public function getTransactions(Request $request): JsonResponse
    {
        PointTransaction::ensureTableExists();

        $query = PointTransaction::with(['user:id,name,phone,email,points,registration_number'])
            ->latest('id');

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        $perPage = min(100, max(10, (int) $request->input('per_page', 20)));
        $transactions = $query->paginate($perPage);

        return response()->json($transactions);
    }

    public function adjustPoints(Request $request, PointService $pointService): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'amount' => ['required', 'integer', 'not_in:0'],
            'description' => ['required', 'string', 'max:255'],
        ]);

        $adminId = auth()->id();
        $transaction = $pointService->adjustUserPoints(
            $validated['user_id'],
            $validated['amount'],
            $validated['description'],
            $adminId
        );

        if (! $transaction) {
            return response()->json(['message' => 'User not found or adjustment failed.'], 422);
        }

        $user = User::find($validated['user_id']);

        return response()->json([
            'message' => 'Points adjusted successfully.',
            'transaction' => $transaction,
            'user_points' => $user?->points ?? 0,
        ]);
    }

    public function getUserUsages(Request $request): JsonResponse
    {
        PointTransaction::ensureTableExists();

        $query = User::query()
            ->where(function ($q) {
                $q->where('points', '>', 0)
                  ->orWhereHas('pointTransactions');
            })
            ->withCount('pointTransactions')
            ->withSum(['pointTransactions as total_gained' => function ($q) {
                $q->where('amount', '>', 0);
            }], 'amount')
            ->withSum(['pointTransactions as total_burned' => function ($q) {
                $q->where('amount', '<', 0);
            }], 'amount');

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        $sort = $request->input('sort', 'points');
        if ($sort === 'total_gained') {
            $query->orderByDesc('total_gained');
        } elseif ($sort === 'total_burned') {
            $query->orderBy('total_burned'); // negative values, so lowest is most burned
        } elseif ($sort === 'recent') {
            $query->latest('id');
        } else {
            $query->orderByDesc('points');
        }

        $perPage = min(100, max(10, (int) $request->input('per_page', 20)));
        $users = $query->paginate($perPage);

        $users->getCollection()->transform(function ($u) {
            $u->total_gained = (int) ($u->total_gained ?? 0);
            $u->total_burned = abs((int) ($u->total_burned ?? 0));
            return $u;
        });

        return response()->json($users);
    }

    public function getUserUsageDetails(int $id, Request $request): JsonResponse
    {
        PointTransaction::ensureTableExists();

        $user = User::findOrFail($id);

        $totalGained = (int) PointTransaction::where('user_id', $user->id)->where('amount', '>', 0)->sum('amount');
        $totalBurned = abs((int) PointTransaction::where('user_id', $user->id)->where('amount', '<', 0)->sum('amount'));

        $txQuery = PointTransaction::where('user_id', $user->id)->latest('id');

        if ($request->input('filter') === 'gained') {
            $txQuery->where('amount', '>', 0);
        } elseif ($request->input('filter') === 'burned') {
            $txQuery->where('amount', '<', 0);
        }

        $transactions = $txQuery->paginate($request->integer('per_page', 25));

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'registration_number' => $user->registration_number,
                'photo_url' => $user->photo_url,
                'points' => (int) ($user->points ?? 0),
            ],
            'summary' => [
                'current_balance' => (int) ($user->points ?? 0),
                'total_gained' => $totalGained,
                'total_burned' => $totalBurned,
                'transactions_count' => PointTransaction::where('user_id', $user->id)->count(),
            ],
            'transactions' => $transactions,
        ]);
    }
}
