<?php

namespace App\Http\Middleware;

use App\Support\ApprovalConfiguration;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApprover
{
    public function __construct(private ApprovalConfiguration $configuration) {}

    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(
            $this->configuration->isApprover($request->user()),
            403,
            'Anda tidak terdaftar sebagai approver aktif.',
        );

        return $next($request);
    }
}
