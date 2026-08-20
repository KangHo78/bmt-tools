<?php

return [
    'enabled' => env('SSO_ENABLED', true),
    'main_app_url' => env('MAIN_APP_URL', 'https://main.buanamultiteknik.com'),
    'required_group' => env('SSO_REQUIRED_GROUP'),
];
