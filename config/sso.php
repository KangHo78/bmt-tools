<?php

return [
    'enabled' => env('SSO_ENABLED', true),
    'main_app_url' => env('MAIN_APP_URL', 'https://main.buanamultiteknik.com'),
    'role_groups' => [
        // Keep the spelling exactly as stored in buana_multi.users (group id 219).
        'admin' => 'TOOLS_MANAGEMENT_ADMINISRTATOR',
        'petugas' => 'TOOLS_MANAGEMENT_ADMIN',
        'user' => 'TOOLS_MANAGEMENT_USER',
    ],
];
