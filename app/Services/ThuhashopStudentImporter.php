<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PDO;

class ThuhashopStudentImporter
{
    protected ?PDO $pdo = null;
    protected string $prefix = 'wp_';

    // DoctorWallah Course IDs on thuhashop.com
    protected array $courseMap = [
        3220   => 'anatomy-thorax-card',
        3224   => 'cellular-physiology-blood-card',
        3226   => 'biophysics-biomolecules-card',
        18456  => 'general-embryology',
        18458  => 'anatomy-thorax-card',
        18460  => 'general-histology',
        18464  => 'cellular-physiology-blood-card',
        18466  => 'renal-biochemistry',
        18468  => 'superior-extremity-card-upper-limb',
        18470  => 'head-neck-archive',
        18474  => 'reproductive-physiology-archive',
        18476  => 'general-embryology',
        60783  => 'superior-extremity-card-upper-limb',
        60785  => 'cardiovascular-system-card',
        60789  => 'food-nutrition-card',
        129927 => 'abdomen-card',
        129929 => 'respiratory-physiology-card',
        129935 => 'metabolism',
        145895 => 'inferior-extremity',
        145897 => 'renal-biochemistry',
        145899 => 'gi-renal-physiology',
    ];

    // Group IDs on thuhashop.com
    protected array $groupMap = [
        3222   => '1st-card-full-course',
        18452  => 'mbbs-first-phase-1st-term',
        60779  => 'mbbs-first-phase-2nd-term',
        60781  => '2nd-card-full-course',
        129925 => 'mbbs-first-phase-3rd-card',
        145893 => 'mbbs-4th-card',
    ];

    public function connect(): bool
    {
        $configPath = '/home/u825551938/domains/thuhashop.com/public_html/wp-config.php';
        if (!file_exists($configPath)) {
            $configPath = base_path('../thuhashop.com/public_html/wp-config.php');
        }

        if (!file_exists($configPath)) {
            Log::error("ThuhashopStudentImporter: wp-config.php not found at {$configPath}");
            return false;
        }

        $content = file_get_contents($configPath);
        preg_match("/define\(\s*['\"]DB_NAME['\"]\s*,\s*['\"](.*?)['\"]\s*\);/", $content, $mName);
        preg_match("/define\(\s*['\"]DB_USER['\"]\s*,\s*['\"](.*?)['\"]\s*\);/", $content, $mUser);
        preg_match("/define\(\s*['\"]DB_PASSWORD['\"]\s*,\s*['\"](.*?)['\"]\s*\);/", $content, $mPass);
        preg_match("/\\\$table_prefix\s*=\s*['\"](.*?)['\"];/", $content, $mPrefix);

        if (empty($mName[1]) || empty($mPass[1])) {
            Log::error("ThuhashopStudentImporter: Could not parse DB credentials from wp-config.php");
            return false;
        }

        $this->prefix = $mPrefix[1] ?? 'wp_';
        $this->pdo = new PDO(
            "mysql:host=127.0.0.1;dbname={$mName[1]};charset=utf8mb4",
            $mUser[1],
            $mPass[1],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );

        return true;
    }

    /**
     * Inspect student enrollment structures and counts on thuhashop.com (strictly read-only)
     */
    public function inspect(): array
    {
        if (!$this->pdo && !$this->connect()) {
            return ['status' => 'error', 'message' => 'DB connection failed'];
        }

        $prefix = $this->prefix;
        $pdo = $this->pdo;

        // 1. Check all groups on thuhashop
        $groupStmt = $pdo->query("SELECT ID, post_title, post_name FROM {$prefix}posts WHERE post_type = 'groups' AND post_status = 'publish'");
        $groups = $groupStmt->fetchAll();

        // 2. For each known group, find how users are enrolled
        $groupUserCounts = [];
        $sampleGroupUsers = [];
        foreach ($this->groupMap as $gid => $slug) {
            // Check usermeta with learndash_group_users_{gid}
            $stmt = $pdo->prepare("SELECT user_id FROM {$prefix}usermeta WHERE meta_key = ?");
            $stmt->execute(["learndash_group_users_{$gid}"]);
            $uids1 = $stmt->fetchAll(PDO::FETCH_COLUMN);

            // Check usermeta with learndash_group_enrolled_{gid}
            $stmt = $pdo->prepare("SELECT user_id FROM {$prefix}usermeta WHERE meta_key = ?");
            $stmt->execute(["learndash_group_enrolled_{$gid}"]);
            $uids2 = $stmt->fetchAll(PDO::FETCH_COLUMN);

            $allUids = array_unique(array_merge($uids1, $uids2));
            $groupUserCounts[$gid] = [
                'slug' => $slug,
                'count' => count($allUids),
                'sample_uids' => array_slice($allUids, 0, 5),
            ];

            if (!empty($allUids) && empty($sampleGroupUsers)) {
                $sampleUidsStr = implode(',', array_map('intval', array_slice($allUids, 0, 3)));
                $uStmt = $pdo->query("SELECT ID, user_login, user_email, display_name, user_pass FROM {$prefix}users WHERE ID IN ($sampleUidsStr)");
                $sampleGroupUsers = $uStmt->fetchAll();
            }
        }

        // 3. For courses, check course_{cid}_access_from
        $courseUserCounts = [];
        foreach ($this->courseMap as $cid => $slug) {
            $stmt = $pdo->prepare("SELECT user_id FROM {$prefix}usermeta WHERE meta_key = ?");
            $stmt->execute(["course_{$cid}_access_from"]);
            $uids = $stmt->fetchAll(PDO::FETCH_COLUMN);
            if (!empty($uids)) {
                $courseUserCounts[$cid] = [
                    'slug' => $slug,
                    'count' => count($uids),
                ];
            }
        }

        // 4. Sample user meta keys to inspect phone fields
        $metaKeysStmt = $pdo->query("SELECT DISTINCT meta_key FROM {$prefix}usermeta WHERE meta_key LIKE '%phone%' OR meta_key LIKE '%mobile%' OR meta_key LIKE '%billing%' LIMIT 30");
        $phoneMetaKeys = $metaKeysStmt->fetchAll(PDO::FETCH_COLUMN);

        return [
            'status' => 'success',
            'groups_on_wp' => $groups,
            'group_user_counts' => $groupUserCounts,
            'course_user_counts' => $courseUserCounts,
            'phone_meta_keys' => $phoneMetaKeys,
            'sample_users' => $sampleGroupUsers,
        ];
    }

    /**
     * Import all students from thuhashop.com into doctorwallah.com with their accounts and enrollments
     */
    public function importStudents(): array
    {
        if (!$this->pdo && !$this->connect()) {
            return ['status' => 'error', 'message' => 'DB connection failed'];
        }

        $prefix = $this->prefix;
        $pdo = $this->pdo;

        // Cache doctorwallah course records keyed by slug
        $dwCourses = Course::all()->keyBy('slug');

        // Group to sub-courses mapping (when a student is in a group/term bundle, they get the bundle AND subcourses)
        $groupSubCourses = [
            '1st-card-full-course' => [
                'anatomy-thorax-card',
                'cellular-physiology-blood-card',
                'biophysics-biomolecules-card',
                'general-histology',
                'general-embryology',
            ],
            'mbbs-first-phase-1st-term' => [
                '1st-card-full-course',
                '2nd-card-full-course',
                'anatomy-thorax-card',
                'cellular-physiology-blood-card',
                'biophysics-biomolecules-card',
                'general-histology',
                'general-embryology',
                'superior-extremity-card-upper-limb',
                'cardiovascular-system-card',
                'food-nutrition-card',
            ],
            '2nd-card-full-course' => [
                'superior-extremity-card-upper-limb',
                'cardiovascular-system-card',
                'food-nutrition-card',
            ],
            'mbbs-first-phase-2nd-term' => [
                'mbbs-first-phase-3rd-card',
                'mbbs-4th-card',
                'abdomen-card',
                'respiratory-physiology-card',
                'metabolism',
                'inferior-extremity',
                'renal-biochemistry',
                'gi-renal-physiology',
            ],
            'mbbs-first-phase-3rd-card' => [
                'abdomen-card',
                'respiratory-physiology-card',
                'metabolism',
            ],
            'mbbs-4th-card' => [
                'inferior-extremity',
                'renal-biochemistry',
                'gi-renal-physiology',
            ],
        ];

        // 1. Gather all student IDs and their enrolled courses/groups
        // Map: wp_user_id => ['group_slugs' => [...], 'course_slugs' => [...], 'enrolled_at' => min_timestamp]
        $studentEnrollments = [];

        // A. From LearnDash Groups
        foreach ($this->groupMap as $gid => $slug) {
            $stmt = $pdo->prepare("
                SELECT user_id, meta_value 
                FROM {$prefix}usermeta 
                WHERE meta_key IN (?, ?)
            ");
            $stmt->execute(["learndash_group_users_{$gid}", "learndash_group_enrolled_{$gid}"]);
            $rows = $stmt->fetchAll();

            foreach ($rows as $r) {
                $uid = (int)$r['user_id'];
                if (!$uid) continue;
                if (!isset($studentEnrollments[$uid])) {
                    $studentEnrollments[$uid] = ['groups' => [], 'courses' => []];
                }
                $studentEnrollments[$uid]['groups'][$slug] = true;
            }
        }

        // B. From LearnDash Courses
        foreach ($this->courseMap as $cid => $slug) {
            $stmt = $pdo->prepare("
                SELECT user_id, meta_value 
                FROM {$prefix}usermeta 
                WHERE meta_key = ?
            ");
            $stmt->execute(["course_{$cid}_access_from"]);
            $rows = $stmt->fetchAll();

            foreach ($rows as $r) {
                $uid = (int)$r['user_id'];
                if (!$uid) continue;
                if (!isset($studentEnrollments[$uid])) {
                    $studentEnrollments[$uid] = ['groups' => [], 'courses' => []];
                }
                $studentEnrollments[$uid]['courses'][$slug] = true;
            }
        }

        // C. From WooCommerce Orders (DoctorWallah products)
        // Find product IDs matching DW courses or groups
        $dwSlugs = array_merge(array_values($this->groupMap), array_values($this->courseMap));
        $allWpTargetIds = array_merge(array_keys($this->groupMap), array_keys($this->courseMap));
        $targetIn = implode(',', array_map('intval', $allWpTargetIds));

        // Check if there are WC order items
        try {
            $orderStmt = $pdo->query("
                SELECT p.ID as order_id, pm_user.meta_value as customer_user_id,
                       oim_prod.meta_value as product_id, p.post_date
                FROM {$prefix}posts p
                JOIN {$prefix}postmeta pm_user ON p.ID = pm_user.post_id AND pm_user.meta_key = '_customer_user'
                JOIN {$prefix}woocommerce_order_items oi ON p.ID = oi.order_id AND oi.order_item_type = 'line_item'
                JOIN {$prefix}woocommerce_order_itemmeta oim_prod ON oi.order_item_id = oim_prod.order_item_id AND oim_prod.meta_key = '_product_id'
                WHERE p.post_type = 'shop_order' 
                  AND p.post_status IN ('wc-completed', 'wc-processing')
                  AND oim_prod.meta_value IN ($targetIn)
            ");
            $orderRows = $orderStmt->fetchAll();
            foreach ($orderRows as $or) {
                $uid = (int)$or['customer_user_id'];
                $pid = (int)$or['product_id'];
                if (!$uid) continue;

                if (!isset($studentEnrollments[$uid])) {
                    $studentEnrollments[$uid] = ['groups' => [], 'courses' => []];
                }

                if (isset($this->groupMap[$pid])) {
                    $studentEnrollments[$uid]['groups'][$this->groupMap[$pid]] = true;
                }
                if (isset($this->courseMap[$pid])) {
                    $studentEnrollments[$uid]['courses'][$this->courseMap[$pid]] = true;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("ThuhashopStudentImporter: WC orders check skipped: " . $e->getMessage());
        }

        $allUids = array_keys($studentEnrollments);
        if (empty($allUids)) {
            return [
                'status' => 'warning',
                'message' => 'No enrolled students found for DoctorWallah courses/groups on thuhashop.com',
                'student_count' => 0,
            ];
        }

        // 2. Fetch user records and usermeta in chunks
        $usersCreated = 0;
        $usersUpdated = 0;
        $enrollmentsCreated = 0;
        $skipped = 0;

        $chunkSize = 100;
        $chunks = array_chunk($allUids, $chunkSize);

        foreach ($chunks as $chunkUids) {
            $inClause = implode(',', array_map('intval', $chunkUids));

            // Fetch wp_users rows
            $uStmt = $pdo->query("SELECT ID, user_login, user_pass, user_email, user_registered, display_name FROM {$prefix}users WHERE ID IN ($inClause)");
            $wpUsers = $uStmt->fetchAll();
            $wpUsersById = [];
            foreach ($wpUsers as $u) {
                $wpUsersById[$u['ID']] = $u;
            }

            // Fetch usermeta for these users
            $mStmt = $pdo->query("
                SELECT user_id, meta_key, meta_value 
                FROM {$prefix}usermeta 
                WHERE user_id IN ($inClause) 
                  AND meta_key IN ('first_name', 'last_name', 'billing_phone', 'phone', 'digits_phone', 'billing_first_name', 'billing_last_name')
            ");
            $metaRows = $mStmt->fetchAll();
            $metaByUid = [];
            foreach ($metaRows as $mr) {
                $metaByUid[$mr['user_id']][$mr['meta_key']] = $mr['meta_value'];
            }

            // Process each student
            foreach ($chunkUids as $wpUid) {
                if (!isset($wpUsersById[$wpUid])) {
                    $skipped++;
                    continue;
                }

                $wpUser = $wpUsersById[$wpUid];
                $meta = $metaByUid[$wpUid] ?? [];

                // Resolve Name
                $firstName = trim($meta['first_name'] ?? ($meta['billing_first_name'] ?? ''));
                $lastName = trim($meta['last_name'] ?? ($meta['billing_last_name'] ?? ''));
                $fullName = trim("{$firstName} {$lastName}");
                if (empty($fullName)) {
                    $fullName = trim($wpUser['display_name']) ?: trim($wpUser['user_login']);
                }

                // Resolve Phone Number
                // 1. Check user_login (very common in BD LMS for username to be 01xxxxxxxxx)
                $phoneCandidate = null;
                $loginCandidate = User::normalizePhone($wpUser['user_login']);
                if ($loginCandidate && User::isValidPhoneNumber($loginCandidate)) {
                    $phoneCandidate = $loginCandidate;
                }

                // 2. Check billing_phone / phone / digits_phone
                if (!$phoneCandidate) {
                    $rawPhone = $meta['billing_phone'] ?? ($meta['phone'] ?? ($meta['digits_phone'] ?? null));
                    $metaCandidate = User::normalizePhone($rawPhone);
                    if ($metaCandidate && User::isValidPhoneNumber($metaCandidate)) {
                        $phoneCandidate = $metaCandidate;
                    }
                }

                // 3. If still no valid phone, check display_name or fallback to unique placeholder
                if (!$phoneCandidate) {
                    $dnCandidate = User::normalizePhone($wpUser['display_name']);
                    if ($dnCandidate && User::isValidPhoneNumber($dnCandidate)) {
                        $phoneCandidate = $dnCandidate;
                    }
                }

                // If completely absent, generate deterministic unique BD dummy phone: +88019999 + padded ID
                if (!$phoneCandidate) {
                    $phoneCandidate = '+8801999' . str_pad((string)$wpUid, 6, '0', STR_PAD_LEFT);
                }

                // Resolve Email
                $email = strtolower(trim($wpUser['user_email']));
                if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $email = "student_{$wpUid}@doctorwallah.com";
                }

                // Raw WordPress password hash
                $rawWpHash = $wpUser['user_pass'];

                // Find or create User in DoctorWallah
                // Check by phone first, then by email
                $existingUser = User::where('phone', $phoneCandidate)->first();
                if (!$existingUser && $email) {
                    $existingUser = User::where('email', $email)->first();
                }

                if ($existingUser) {
                    // Update user password to WordPress hash if they don't have a modern bcrypt or if keeping sync
                    $existingUser->password = $rawWpHash;
                    $existingUser->status = User::STATUS_ACTIVE;
                    if (empty($existingUser->phone) && $phoneCandidate) {
                        $existingUser->phone = $phoneCandidate;
                    }
                    $existingUser->save();
                    $targetUser = $existingUser;
                    $usersUpdated++;
                } else {
                    // Make email unique if clash exists
                    if (User::where('email', $email)->exists()) {
                        $email = "wp_{$wpUid}_" . $email;
                    }

                    // Create new student
                    $newUser = new User();
                    $newUser->name = $fullName;
                    $newUser->phone = $phoneCandidate;
                    $newUser->email = $email;
                    $newUser->password = $rawWpHash;
                    $newUser->role = User::ROLE_STUDENT;
                    $newUser->status = User::STATUS_ACTIVE;
                    $newUser->created_at = $wpUser['user_registered'] ?: now();
                    $newUser->save();

                    $targetUser = $newUser;
                    $usersCreated++;
                }

                // Enroll student into their courses and packages
                $targetCourses = [];

                // Direct groups
                $enrolledGroups = array_keys($studentEnrollments[$wpUid]['groups'] ?? []);
                foreach ($enrolledGroups as $gSlug) {
                    $targetCourses[$gSlug] = true;
                    // Sub-courses
                    if (isset($groupSubCourses[$gSlug])) {
                        foreach ($groupSubCourses[$gSlug] as $subSlug) {
                            $targetCourses[$subSlug] = true;
                        }
                    }
                }

                // Direct courses
                $enrolledDirectCourses = array_keys($studentEnrollments[$wpUid]['courses'] ?? []);
                foreach ($enrolledDirectCourses as $cSlug) {
                    $targetCourses[$cSlug] = true;
                }

                // Create Enrollment records
                foreach (array_keys($targetCourses) as $cSlug) {
                    $c = $dwCourses[$cSlug] ?? null;
                    if (!$c) continue;

                    $enr = Enrollment::firstOrCreate(
                        [
                            'user_id' => $targetUser->id,
                            'course_id' => $c->id,
                        ],
                        [
                            'status' => Enrollment::STATUS_ACTIVE,
                            'enrolled_at' => $wpUser['user_registered'] ?: now(),
                        ]
                    );

                    if ($enr->wasRecentlyCreated) {
                        $enrollmentsCreated++;
                    }
                }
            }
        }

        return [
            'status' => 'success',
            'total_students_found' => count($allUids),
            'users_created' => $usersCreated,
            'users_updated' => $usersUpdated,
            'enrollments_created' => $enrollmentsCreated,
            'skipped' => $skipped,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
