<?php

use App\Http\Middleware\EnsureActiveUser;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\EnsureSsoGroup;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SsoCookieAuth;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['uuid']);

        $middleware->alias([
            'role' => EnsureRole::class,
            'sso.group' => EnsureSsoGroup::class,
        ]);
        $middleware->web(append: [
            SsoCookieAuth::class,
            EnsureActiveUser::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // The SSO cookie must become a Laravel user after the session starts,
        // but before route middleware such as `auth` is evaluated.
        $middleware->appendToPriorityList(StartSession::class, SsoCookieAuth::class);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
