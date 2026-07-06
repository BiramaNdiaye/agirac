<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class FtpService
{
    public function listFiles($directory = '')
    {
        return Storage::disk('ftp')->listContents($directory);
    }

    public function downloadFile($remotePath)
    {
        return Storage::disk('ftp')->get($remotePath);
    }

    public function uploadFile($localPath, $remotePath)
    {
        return Storage::disk('ftp')->put($remotePath, fopen($localPath, 'r+'));
    }
}