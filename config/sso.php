<?php

return [
    'enabled' => env('SSO_ENABLED', true),
    'main_app_url' => env('MAIN_APP_URL', 'https://main.buanamultiteknik.com'),
    'uploads_url' => env('MAIN_APP_UPLOADS_URL', rtrim(env('MAIN_APP_URL', 'https://main.buanamultiteknik.com'), '/').'/api/uploads'),
    'role_groups' => [
        'admin' => 'TOOLS_MANAGEMENT_ADMINISTRATOR',
        'petugas' => 'TOOLS_MANAGEMENT_ADMIN',
        'user' => 'TOOLS_MANAGEMENT_USER',
    ],
];
