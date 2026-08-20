<?php

namespace App\Http\Middleware;

use App\Models\SsoUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSsoGroup
{
    public function handle(Request $request, Closure $next): Response
    {
        $requiredGroup = config('sso.required_group');

        if (filled($requiredGroup)) {
            $user = $request->user();
            $ssoUser = $user?->sso_user_id
                ? SsoUser::query()->find($user->sso_user_id)
                : null;

            abort_unless(
                $ssoUser?->hasGroup($requiredGroup),
                403,
                'Anda tidak memiliki akses ke TAMS.',
            );
        }

        return $next($request);
    }
}
