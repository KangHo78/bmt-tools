<?php

namespace App\Http\Middleware;

use App\Models\SsoUser;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class SsoCookieAuth
{
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
        $user = $this->synchronizeUser($ssoUser, $managementRole);

        if (! Auth::check() || (int) Auth::id() !== (int) $user->getKey()) {
            Auth::login($user);
            $request->session()->regenerate();
        }

        return $next($request);
    }

    private function synchronizeUser(SsoUser $ssoUser, ?string $managementRole): User
    {
        $ssoEmail = filled($ssoUser->email)
            ? Str::lower(trim((string) $ssoUser->email))
            : null;
        $user = User::query()->where('sso_user_id', $ssoUser->getKey())->first();

        if (! $user && $ssoEmail) {
            $user = User::query()->whereRaw('LOWER(email) = ?', [$ssoEmail])->first();
        }

        if ($user && $user->sso_user_id && (int) $user->sso_user_id !== (int) $ssoUser->getKey()) {
            abort(409, 'Email SSO sudah terhubung dengan akun lain. Hubungi administrator.');
        }

        $user ??= new User([
            'email' => $ssoEmail ?: sprintf('sso-%d@users.invalid', $ssoUser->getKey()),
            'password' => Hash::make(Str::random(64)),
            'role' => 'user',
            'token_quota' => 10,
            'token_used' => 0,
            'is_active' => true,
        ]);

        $user->forceFill([
            'sso_user_id' => $ssoUser->getKey(),
            'sso_username' => $ssoUser->username,
            'name' => $ssoUser->name ?: $ssoUser->username,
            'email' => $ssoEmail ?: $user->email,
            'phone' => $ssoUser->no_hp ?: $user->phone,
            'role' => $managementRole ?: $user->role,
            'last_sso_login_at' => now(),
        ])->save();

        return $user;
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
