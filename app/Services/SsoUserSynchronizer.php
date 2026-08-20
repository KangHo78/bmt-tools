<?php

namespace App\Services;

use App\Models\Borrower;
use App\Models\SsoUser;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SsoUserSynchronizer
{
    public function synchronize(SsoUser $ssoUser, ?string $managementRole = null, bool $recordLogin = false): User
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

        $attributes = [
            'sso_user_id' => $ssoUser->getKey(),
            'sso_username' => $ssoUser->username,
            'name' => $ssoUser->name ?: $ssoUser->username,
            'email' => $ssoEmail ?: $user->email,
            'phone' => $ssoUser->no_hp ?: $user->phone,
            'role' => $managementRole ?: $user->role,
        ];

        if ($recordLogin) {
            $attributes['last_sso_login_at'] = now();
        }

        $user->forceFill($attributes)->save();

        Borrower::query()->updateOrCreate(
            ['user_id' => $user->id],
            ['name' => $user->name, 'institution' => $user->institution, 'phone' => $user->phone, 'is_active' => $user->is_active],
        );

        return $user;
    }
}
