<?php

namespace PS0132E282\Core\Cats;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use PS0132E282\Core\Models\Media;

class FileMedia implements CastsAttributes
{
    /**
     * Default disk for storing files.
     */
    protected string $defaultDisk = 'public';

    /**
     * Cache for uploaded files in current request to avoid duplicates
     */
    protected static array $uploadCache = [];

    /**
     * Transform the attribute from the underlying model values.
     * Returns single object for single file, or array for multiple files.
     *
     * @return array|array[]|null
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?array
    {
        if (is_null($value) || empty($value)) {
            return null;
        }

        // If value is already an array
        if (is_array($value)) {
            // Check if it's array of objects (multiple files) or single object
            if ($this->isArrayOfMediaObjects($value)) {
                // Multiple files: normalize each item
                return array_map([$this, 'normalizeMediaData'], $value);
            }

            // Single object
            return $this->normalizeMediaData($value);
        }

        // Decode JSON string
        $decoded = json_decode($value, true);

        // If decoding failed or result is not an array, treat as simple path/url
        if (! is_array($decoded)) {
            // If it's a string, treat it as a path or URL (single file)
            if (is_string($value) && ! empty($value)) {
                return $this->createMediaDataFromPath($value);
            }

            return null;
        }

        // Check if decoded is array of objects (multiple files) or single object
        if ($this->isArrayOfMediaObjects($decoded)) {
            // Multiple files: normalize each item
            return array_map([$this, 'normalizeMediaData'], $decoded);
        }

        // Single file: normalize single object
        return $this->normalizeMediaData($decoded);
    }

    /**
     * Transform the attribute to its underlying model values.
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if (is_null($value) || (is_array($value) && empty($value))) {
            return null;
        }

        // Handle UploadedFile - upload file and create Media record
        if ($value instanceof UploadedFile) {
            $media = $this->handleFileUpload($value);
            if ($media) {
                $mediaData = $this->convertMediaToFileMediaFormat($media);

                return json_encode($mediaData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            return null;
        }

        // Handle array of UploadedFiles
        if (is_array($value) && ! empty($value)) {
            $firstItem = reset($value);
            if ($firstItem instanceof UploadedFile) {
                $mediaArray = [];
                foreach ($value as $file) {
                    if ($file instanceof UploadedFile) {
                        $media = $this->handleFileUpload($file);
                        if ($media) {
                            $mediaArray[] = $this->convertMediaToFileMediaFormat($media);
                        }
                    }
                }
                if (! empty($mediaArray)) {
                    return json_encode($mediaArray, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }

                return null;
            }
        }
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return json_encode($this->normalizeMediaData($decoded), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            $mediaData = $this->createMediaDataFromPath($value);

            return json_encode($mediaData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        if (is_array($value)) {
            // Check if it's array of media objects (multiple files) or single object
            if ($this->isArrayOfMediaObjects($value)) {
                // Multiple files: normalize each item
                $normalized = array_map([$this, 'normalizeMediaData'], $value);

                return json_encode($normalized, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            // Single object
            return json_encode($this->normalizeMediaData($value), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        return null;
    }

    /**
     * Check if array is array of media objects (multiple files)
     * vs single media object
     */
    protected function isArrayOfMediaObjects(array $data): bool
    {
        if (empty($data)) {
            return false;
        }

        // Check if array is indexed (0, 1, 2...) and first item has media structure
        $isIndexed = array_keys($data) === range(0, count($data) - 1);

        if (! $isIndexed) {
            // Associative array = single object
            return false;
        }

        // Check if first item has media structure (has 'path' or 'absolute_url' or 'id')
        $firstItem = reset($data);
        if (! is_array($firstItem)) {
            return false;
        }

        // If first item has media structure keys, it's array of media objects
        return isset($firstItem['path']) || isset($firstItem['absolute_url']) || isset($firstItem['id']);
    }

    protected function normalizeMediaData(array $data): array
    {
        $normalized = [
            'id' => $data['id'] ?? null,
            'path' => null,
            'name' => $data['name'] ?? null,
            'type' => $data['type'] ?? 'file',
            'size' => $data['size'] ?? null,
            'mime_type' => $data['mime_type'] ?? $data['mimeType'] ?? null,
            'disk' => $data['disk'] ?? $this->defaultDisk,
        ];

        if (! empty($data['path'])) {
            $normalized['path'] = $this->ensureRelativePath($data['path']);
        } elseif (! empty($data['absolute_url'])) {
            $normalized['path'] = $this->getPathFromUrl($data['absolute_url']);
        } elseif (! empty($data['url'])) {
            // Backward compatibility: extract path from url
            $normalized['path'] = $this->getPathFromUrl($data['url']);
        }

        // If name is not set, extract from path
        if (empty($normalized['name']) && ! empty($normalized['path'])) {
            $normalized['name'] = basename($normalized['path']);
        }

        // Always generate URL dynamically from path (with current domain)
        if (! empty($normalized['path'])) {
            $normalized['absolute_url'] = $this->getUrlFromPath($normalized['path'], $normalized['disk']);
        } elseif (! empty($data['absolute_url'])) {
            // If absolute_url is provided but no path, use it directly
            $normalized['absolute_url'] = $data['absolute_url'];
        } elseif (! empty($data['url'])) {
            // Backward compatibility: if url is provided, use it as absolute_url
            $normalized['absolute_url'] = $data['url'];
        }

        return array_filter($normalized, fn ($value) => $value !== null);
    }

    /**
     * Create media data from a simple path or URL string.
     * Always stores relative path (without domain).
     */
    protected function createMediaDataFromPath(string $pathOrUrl): array
    {
        // Check if it's a URL
        if (filter_var($pathOrUrl, FILTER_VALIDATE_URL)) {
            // Extract relative path from URL (remove domain)
            $relativePath = $this->getPathFromUrl($pathOrUrl);

            return [
                'path' => $relativePath,
                'name' => basename($relativePath),
                'disk' => $this->defaultDisk,
            ];
        }

        // It's already a path, ensure it's relative
        $relativePath = $this->ensureRelativePath($pathOrUrl);

        return [
            'path' => $relativePath,
            'name' => basename($relativePath),
            'disk' => $this->defaultDisk,
        ];
    }

    /**
     * Get URL from path using current domain from config/environment.
     * Domain is flexible and can be changed per environment.
     */
    protected function getUrlFromPath(string $path, string $disk): ?string
    {
        // Get base URL from config (flexible for different environments)
        $baseUrl = $this->getBaseUrl();

        if (empty($baseUrl)) {
            return null;
        }

        // Ensure path is relative
        $relativePath = $this->ensureRelativePath($path);

        // Construct full URL
        if ($disk === 'public') {
            // For public disk, use /storage prefix
            return rtrim($baseUrl, '/').'/storage/'.ltrim($relativePath, '/');
        }

        // For other disks, check config
        $diskConfig = config("filesystems.disks.{$disk}", []);

        if (isset($diskConfig['url'])) {
            // Use configured URL base
            return rtrim($diskConfig['url'], '/').'/'.ltrim($relativePath, '/');
        }

        // Default: use base URL with path
        return rtrim($baseUrl, '/').'/'.ltrim($relativePath, '/');
    }

    /**
     * Get base URL from config or environment.
     * Flexible for different environments (console.admin.com, etc.)
     */
    protected function getBaseUrl(): string
    {
        // Try to get from filesystem config first
        $diskConfig = config('filesystems.disks.public', []);
        if (isset($diskConfig['url'])) {
            // Extract base URL from disk config
            $url = $diskConfig['url'];
            // Remove /storage if present
            $url = preg_replace('#/storage/?$#', '', $url);

            return $url;
        }

        // Fallback to APP_URL from environment
        $appUrl = config('app.url', '');
        if ($appUrl) {
            return $appUrl;
        }

        // Last resort: try to get from request
        if (app()->bound('request')) {
            $request = app('request');
            if ($request) {
                return $request->getSchemeAndHttpHost();
            }
        }

        return '';
    }

    /**
     * Extract relative path from URL (remove domain and prefixes).
     * Always returns relative path without domain.
     */
    protected function getPathFromUrl(string $url): ?string
    {
        $parsedUrl = parse_url($url);

        if (isset($parsedUrl['path'])) {
            // Remove /storage prefix if present
            $path = ltrim($parsedUrl['path'], '/');
            $path = preg_replace('#^storage/#', '', $path);

            // Ensure it's a relative path (no leading slash)
            return ltrim($path, '/');
        }

        return null;
    }

    /**
     * Ensure path is relative (remove domain and leading slashes).
     */
    protected function ensureRelativePath(string $path): string
    {
        // If it's a full URL, extract path
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $this->getPathFromUrl($path) ?? $path;
        }

        // Remove leading slash to make it relative
        $path = ltrim($path, '/');

        // Remove any domain-like patterns at the start
        $path = preg_replace('#^https?://[^/]+/#', '', $path);

        return $path;
    }

    /**
     * Handle file upload and create Media record
     * Checks if file already exists by hash to avoid duplicates
     * Uses cache to prevent multiple uploads in same request
     */
    protected function handleFileUpload(UploadedFile $file, ?int $parentId = null, ?string $disk = null): ?Media
    {
        try {
            $disk = $disk ?? $this->defaultDisk;

            // Calculate file hash first
            $fileHash = hash_file('sha256', $file->getRealPath());

            // Check cache first (same request)
            $cacheKey = $fileHash.'_'.$disk.'_'.($parentId ?? 'null');
            if (isset(self::$uploadCache[$cacheKey])) {
                return self::$uploadCache[$cacheKey];
            }

            // Check if file with same hash already exists in database
            $existingMedia = Media::where('hash', $fileHash)
                ->where('disk', $disk)
                ->first();

            if ($existingMedia) {
                // File already exists, cache and return existing record
                self::$uploadCache[$cacheKey] = $existingMedia;

                return $existingMedia;
            }

            // File doesn't exist, upload and create new record
            $media = Media::uploadFile($file, $parentId, $disk);

            // Cache the result
            if ($media) {
                self::$uploadCache[$cacheKey] = $media;
            }

            return $media;
        } catch (\Exception $e) {
            Log::error('FileMedia: File upload failed - '.$e->getMessage());

            return null;
        }
    }

    /**
     * Convert Media model to FileMedia format
     */
    protected function convertMediaToFileMediaFormat(Media $media): array
    {
        return [
            'id' => $media->id,
            'path' => $media->path,
            'name' => $media->name,
            'type' => $media->type ?? 'file',
            'size' => $media->size,
            'mime_type' => $media->mime_type,
            'disk' => $media->disk ?? $this->defaultDisk,
            'absolute_url' => $media->absolute_url,
        ];
    }
}
