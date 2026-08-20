<?php

namespace App\Http\Middleware;

use App\Models\SsoUser;
use App\Services\SsoUserSynchronizer;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SsoCookieAuth
{
    public function __construct(private SsoUserSynchronizer $synchronizer) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (! config('sso.enabled')) {
            return $next($request);
        }

        $ssoId = $request->cookie('uuid');
        $ssoUser = ctype_digit((string) $ssoId)
            ? SsoUser::query()
                ->whereKey($ssoId)
                ->where('is_active', 1)
                ->where('is_group', 0)
                ->first()
            : null;

        if (! $ssoUser) {
            $this->logout($request);

            return $next($request);
        }

        $managementRole = $ssoUser->managementRole();
        $request->attributes->set('sso.management_role', $managementRole);
        $user = $this->synchronizer->synchronize($ssoUser, $managementRole, recordLogin: true);

        if (! Auth::check() || (int) Auth::id() !== (int) $user->getKey()) {
            Auth::login($user);
            $request->session()->regenerate();
        }

        return $next($request);
    }

    private function logout(Request $request): void
    {
        if (! Auth::check()) {
            return;
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
