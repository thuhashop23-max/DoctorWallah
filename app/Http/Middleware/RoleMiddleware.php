<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! Auth::check()) {
            abort(401, 'Authentication required.');
        }

        $user = Auth::user();
        $userRole = $user->role;

        // If admin is accepted, allow users with full admin role OR active custom roles
        if (in_array('admin', $roles, true) && method_exists($user, 'canAccessAdminDashboard') && $user->canAccessAdminDashboard()) {
            return $next($request);
        }

        // If teacher is accepted, allow users with role teacher OR who instruct any course
        if (in_array('teacher', $roles, true) && method_exists($user, 'isTeacher') && $user->isTeacher()) {
            return $next($request);
        }

        if ($roles !== [] && ! in_array($userRole, $roles, true)) {
            abort(403, 'You do not have permission to access this resource.');
        }

        return $next($request);
    }
}
