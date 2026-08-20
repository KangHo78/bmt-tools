<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSsoGroup
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('sso.enabled')) {
            return $next($request);
        }

        abort_unless(
            $request->attributes->get('sso.management_role'),
            403,
            'Anda tidak memiliki grup akses Tools Management.',
        );

        return $next($request);
    }
}
