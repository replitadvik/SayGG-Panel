<?php

namespace Config;

use CodeIgniter\Config\Filters as BaseFilters;

// Core Filters
use CodeIgniter\Filters\CSRF;
use CodeIgniter\Filters\DebugToolbar;
use CodeIgniter\Filters\Honeypot;
use CodeIgniter\Filters\ForceHTTPS;
use CodeIgniter\Filters\PageCache;
use CodeIgniter\Filters\PerformanceMetrics;
use CodeIgniter\Filters\SecureHeaders;

// Your Custom Filters
use App\Filters\AuthFilter;
use App\Filters\AdminFilter;
use App\Filters\RateLimitFilter;
use App\Filters\LoginDeviceGuard;

class Filters extends BaseFilters
{
    public array $aliases = [
        // Core
        'csrf'          => CSRF::class,
        'toolbar'       => DebugToolbar::class,
        'honeypot'      => Honeypot::class,
        'forcehttps'    => ForceHTTPS::class,
        'pagecache'     => PageCache::class,
        'performance'   => PerformanceMetrics::class,
        'secureheaders' => SecureHeaders::class,

        // Custom
        'auth'       => AuthFilter::class,
        'admin'      => AdminFilter::class,
        'rateLimit'  => RateLimitFilter::class,
        'loginGuard' => LoginDeviceGuard::class,
    ];

    /*
    |--------------------------------------------------------------------------
    | Required Filters (CI 4.5+)
    |--------------------------------------------------------------------------
    */
    public array $required = [
        'before' => [
            // Comment forcehttps if you are not forcing https
            // 'forcehttps',
            'pagecache',
        ],
        'after' => [
            'pagecache',
            'performance',
            'toolbar',
        ],
    ];

    /*
    |--------------------------------------------------------------------------
    | Global Filters
    |--------------------------------------------------------------------------
    */
    public array $globals = [
        'before' => [

            // Global rate limit
            'rateLimit' => [
                'except' => [
                    'assets/*',
                    'public/*',
                    'uploads/*',
                    'favicon.ico',
                ],
            ],

            // CSRF enabled everywhere EXCEPT connect
            'csrf' => [
                'except' => [
                    'connect',
                    'connect/*',
                ],
            ],

            // Auth filter — allow guest pages + connect
            'auth' => [
                'except' => [
                    '/',
                    'login',
                    'register',
                    'connect',
                    'connect/*',
                    'verify-otp',
                    'verify-otp/*',
                    'forgot-password',
                    'forgot-password/*',
                    'reset-password',
                    'reset-password/*',
                    'device-reset',
                    'device-reset/*',
                    'price',
                ],
            ],
        ],

        'after' => [],
    ];

    public array $methods = [];

    /*
    |--------------------------------------------------------------------------
    | Route-Specific Filters
    |--------------------------------------------------------------------------
    */
    public array $filters = [

        // Device guard only for login
        'loginGuard' => [
            'before' => [
                'login',
                'login/*',
            ],
        ],
    ];
}