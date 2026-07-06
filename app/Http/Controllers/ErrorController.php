<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use ZipArchive;

class ErrorController extends Controller
{
    private string $baseDir;
    private $disk;

    public function __construct()
    {
        $this->baseDir = storage_path('app/errors/');
        $this->disk    = Storage::disk('sftp_error');
    }

    // ──────────────────────────────────────────────
    //  Entry point
    // ──────────────────────────────────────────────

    public function processAllZipFiles()
    {
        $this->ensureDirectory($this->baseDir);

        $zipFiles = $this->fetchRemoteZipFiles();
        if ($zipFiles === null) {
            return response()->json(['error' => 'Erreur de connexion SFTP'], 500);
        }

        $result = $zipFiles->map(fn($path) => $this->processZip($path))->values()->all();

        return Inertia::render('Errors/Index', [
            'zipFiles'   => $result,
            'totalFiles' => count($result),
            'fetchedAt'  => now()->toISOString(),
        ]);
    }

    // ──────────────────────────────────────────────
    //  Download a single ZIP from SFTP
    // ──────────────────────────────────────────────

    public function downloadZip(string $filename)
    {
        $localPath = storage_path('app/csv_files/' . $filename);

        try {
            File::put($localPath, $this->disk->readStream($filename));
        } catch (\Exception $e) {
            Log::error("Erreur téléchargement ZIP $filename: " . $e->getMessage());
            return response()->json(['error' => 'Fichier non trouvé'], 404);
        }

        return response()->download($localPath)->deleteFileAfterSend(true);
    }

    // ──────────────────────────────────────────────
    //  Private helpers
    // ──────────────────────────────────────────────

    /**
     * List ZIP files on the SFTP disk.
     * Returns null on connection failure.
     */
    private function fetchRemoteZipFiles(): ?\Illuminate\Support\Collection
    {
        try {
            return collect($this->disk->allFiles())
                ->filter(fn($f) => strtolower(pathinfo($f, PATHINFO_EXTENSION)) === 'zip')
                ->values();
        } catch (\Exception $e) {
            Log::error('Erreur SFTP: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Download, extract and parse a single remote ZIP.
     */
    private function processZip(string $remotePath): array
    {
        $filename      = basename($remotePath);
        $localZipPath  = $this->baseDir . $filename;
        $extractFolder = $this->baseDir . pathinfo($filename, PATHINFO_FILENAME) . DIRECTORY_SEPARATOR;

        // Déterminer le type admin depuis le nom du fichier
        $adminType = null;
        if (str_contains(strtolower($filename), 'admin_rds')) $adminType = 'admin_rds';
        elseif (str_contains(strtolower($filename), 'admin_bca')) $adminType = 'admin_bca';

        $info = [
            'zip_name'      => $filename,
            'source_path'   => $remotePath,
            'admin_type'    => $adminType,
            'last_modified' => $this->disk->lastModified($remotePath), // timestamp UNIX
            'downloaded'    => false,
            'extracted'     => false,
            'error_text'    => null,
            'files'         => [],
        ];

        if (!$this->downloadZipLocally($remotePath, $localZipPath, $filename)) {
            return $info;
        }
        $info['downloaded'] = true;

        try {
            $this->ensureDirectory($extractFolder);

            $zip = new ZipArchive();
            if ($zip->open($localZipPath) !== true) {
                throw new \RuntimeException("ZipArchive::open() a échoué pour $localZipPath");
            }

            $zip->extractTo($extractFolder);
            $zip->close();
            $info['extracted'] = true;

            $extracted          = File::allFiles($extractFolder);
            $info['error_text'] = $this->readErrorTxt($extracted);
            $info['files']      = $this->parseExtractedFiles($extracted, $filename);

        } catch (\Exception $e) {
            Log::error("Erreur extraction ZIP $localZipPath: " . $e->getMessage());
        } finally {
            File::delete($localZipPath);
        }

        return $info;
    }

    /**
     * Download a remote ZIP to a local path.
     */
    private function downloadZipLocally(string $remotePath, string $localPath, string $filename): bool
    {
        try {
            File::put($localPath, $this->disk->readStream($remotePath));
            return true;
        } catch (\Exception $e) {
            Log::error("Erreur téléchargement ZIP $filename: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Find and return the contents of error.txt (case-insensitive), or null.
     *
     * @param  \Symfony\Component\Finder\SplFileInfo[]  $files
     */
    private function readErrorTxt(array $files): ?string
    {
        $errorFile = collect($files)->first(
            fn($f) => strtolower($f->getFilename()) === 'error.txt'
        );

        return $errorFile ? File::get($errorFile->getPathname()) : null;
    }

    /**
     * Parse all extracted files except error.txt.
     *
     * @param  \Symfony\Component\Finder\SplFileInfo[]  $files
     */
    private function parseExtractedFiles(array $files, string $zipName): array
    {
        $parsed = [];

        foreach ($files as $file) {
            if (strtolower($file->getFilename()) === 'error.txt') {
                continue;
            }

            $data = [
                'name' => $file->getFilename(),
                'size' => $file->getSize(),
                'path' => $file->getPathname(),
            ];

            $data = match (strtolower($file->getExtension())) {
                'csv'   => $data + $this->parseCsv($file, $zipName),
                'txt'   => $data + ['content' => File::get($file->getPathname())],
                default => $data + ['content' => 'Fichier binaire ou non texte'],
            };

            $parsed[] = $data;
        }

        return $parsed;
    }

    /**
     * Parse a CSV file and return ['headers', 'rows', 'csv_errors'].
     * Lines that cannot be mapped to headers are treated as raw error messages.
     *
     * @param  \Symfony\Component\Finder\SplFileInfo  $file
     */
    private function parseCsv($file, string $zipName): array
    {
        $rawLines = file($file->getPathname());

        if (empty($rawLines)) {
            return ['headers' => [], 'rows' => [], 'csv_errors' => []];
        }

        $all     = array_map(fn($line) => str_getcsv($line, ';'), $rawLines);
        $headers = array_shift($all);
        $rows    = [];
        $csvErrors = [];

        foreach ($all as $lineIndex => $row) {
            // Strip trailing null columns
            while (!empty($row) && end($row) === null) {
                array_pop($row);
            }

            // Une ligne avec une seule colonne et un contenu textuel long
            // est très probablement un message d'erreur brut
            if (count($row) === 1 && !empty(trim($row[0])) && count($headers) > 1) {
                $csvErrors[] = [
                    'line'    => $lineIndex + 2,
                    'message' => trim($row[0]),
                ];
                Log::warning(sprintf(
                    'CSV %s (ZIP %s) : ligne %d — message d\'erreur brut détecté : %s',
                    $file->getFilename(),
                    $zipName,
                    $lineIndex + 2,
                    trim($row[0])
                ));
                continue;
            }

            if (count($row) !== count($headers)) {
                Log::warning(sprintf(
                    'CSV %s (ZIP %s) : ligne %d invalide — attendu %d col., trouvé %d. Contenu : %s',
                    $file->getFilename(),
                    $zipName,
                    $lineIndex + 2,
                    count($headers),
                    count($row),
                    json_encode($row)
                ));
                continue;
            }

            $rows[] = array_combine($headers, $row);
        }

        return ['headers' => $headers, 'rows' => $rows, 'csv_errors' => $csvErrors];
    }

    /**
     * Create a directory if it does not already exist.
     */
    private function ensureDirectory(string $path): void
    {
        if (!File::isDirectory($path)) {
            File::makeDirectory($path, 0755, true);
        }
    }
}
