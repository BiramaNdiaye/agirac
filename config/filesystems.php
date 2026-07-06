<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],
        'sftp' => [
            'driver' => 'sftp',
            'host' => env('SFTP_HOST'),     
            'username' => env('SFTP_USERNAME'),
            'root'     => '/',
            'passive'  => true,
            'port' =>(int) env('SFTP_PORT', 31451),
            'privateKey' => storage_path('keys/id_ecdsa'),
            'timeout' => 30,
           

        ],
        'sftp_out' => [
            'driver' => 'sftp',
            'host' => env('SFTP_HOST'),     
            'username' => env('SFTP_USERNAME'),
            'root'     => '/IN',
            'passive'  => true,
            'port' =>(int) env('SFTP_PORT', 31451),
            'privateKey' => storage_path('keys/id_ecdsa'),
            'timeout' => 30,
           

        ],

 'sftp_test' => [
    'driver' => 'sftp',
    'host' => env('SFTP_OUT_HOST'),
    'port' => (int) env('SFTP_OUT_PORT', 22), // Assurez-vous que c'est un entier
    'username' => env('SFTP_OUT_USERNAME'),
    'password' => env('SFTP_OUT_PASSWORD'), // Ajoutez cette ligne si vous utilisez mot de passe
    'privateKey' => env('SFTP_PRIVATE_KEY'), // Alternative: utilisez une clé privée
    'root' => '/', // Valeur par défaut
    'timeout' => 30,
    'directoryPerm' => 0755, // Permissions pour les répertoires créés
],

'sftp_in_test' => [
    'driver' => 'sftp',
    'host' => env('SFTP_OUT_HOST'),
    'port' => (int) env('SFTP_OUT_PORT', 22), // Assurez-vous que c'est un entier
    'username' => env('SFTP_OUT_USERNAME'),
    'password' => env('SFTP_OUT_PASSWORD'), // Ajoutez cette ligne si vous utilisez mot de passe
    'privateKey' => env('SFTP_PRIVATE_KEY'), // Alternative: utilisez une clé privée
    'root' => '/home/ubuntu', // Valeur par défaut
    'timeout' => 30,
    'directoryPerm' => 0755, // Permissions pour les répertoires créés
],


'sftp_in' => [
            'driver' => 'sftp',
            'host' => env('SFTP_HOST'),     
            'username' => env('SFTP_USERNAME'),
            'root'     => '/OUT',
            'passive'  => true,
            'port' =>(int) env('SFTP_PORT', 31451),
            'privateKey' => storage_path('keys/id_ecdsa'),
            'timeout' => 50,
           

        ],


        'sftp_error' => [
            'driver' => 'sftp',
            'host' => env('SFTP_HOST'),     
            'username' => env('SFTP_USERNAME'),
            'root'     => '/ERROR',
            'passive'  => true,
            'port' =>(int) env('SFTP_PORT', 31451),
            'privateKey' => storage_path('keys/id_ecdsa'),
            'timeout' => 30,
           

        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
