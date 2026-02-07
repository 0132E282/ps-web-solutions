<?php

namespace PS0132E282\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Media extends Model
{
    protected $table = 'media';

    protected $fillable = [
        'name',
        'path',
        'type',
        'alt',
        'parent_id',
        'size',
        'mime_type',
        'extension',
        'hash',
        'disk',
        'absolute_url',
    ];

    protected $casts = [
        'size' => 'integer',
        'parent_id' => 'integer',
    ];

    /**
     * Default disk for storing files.
     */
    protected string $defaultDisk = 'public';

    /**
     * Build absolute URL for a file path.
     */
    public function buildUrl(string $path, string $disk): string
    {
        try {
            $diskConfig = config("filesystems.disks.{$disk}", []);

            if (isset($diskConfig['url'])) {
                return rtrim($diskConfig['url'], '/').'/'.ltrim($path, '/');
            }

            if ($disk === 'public') {
                $baseUrl = config('app.url', '');
                if ($baseUrl) {
                    return rtrim($baseUrl, '/').'/storage/'.ltrim($path, '/');
                }

                return asset('storage/'.ltrim($path, '/'));
            }

            return asset($path);
        } catch (\Exception $e) {
            return asset($path);
        }
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Media::class, 'parent_id');
    }

    public static function uploadFile(
        UploadedFile $file,
        ?int $parentId = null,
        ?string $disk = null
    ): self {
        $disk = $disk ?? 'public';
        $storage = Storage::disk($disk);

        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $fileName = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)).'_'.time().'.'.$extension;

        $folderPath = '';
        if ($parentId) {
            $parent = self::find($parentId);
            if ($parent && $parent->type === 'folder') {
                $folderPath = rtrim($parent->path, '/');
            }
        }
        $filePath = $folderPath ? $folderPath.'/'.$fileName : $fileName;

        $storedPath = $storage->putFileAs($folderPath ?: '', $file, $fileName);

        $fileHash = hash_file('sha256', $file->getRealPath());

        $media = new self;
        $absoluteUrl = $media->buildUrl($storedPath, $disk);

        $media = new self([
            'name' => $originalName,
            'path' => $storedPath,
            'type' => 'file',
            'parent_id' => $parentId,
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'extension' => $extension,
            'hash' => $fileHash,
            'disk' => $disk,
            'absolute_url' => $absoluteUrl,
        ]);

        $media->save();

        return $media;
    }

    public function deleteFile(bool $deleteFromStorage = true): bool
    {
        if ($this->type === 'folder') {
            $children = $this->children;
            foreach ($children as $child) {
                $child->deleteFile($deleteFromStorage);
            }

            if ($deleteFromStorage && $this->path) {
                try {
                    $storage = Storage::disk($this->disk ?? $this->defaultDisk);
                    if ($storage->exists($this->path)) {
                        $storage->deleteDirectory($this->path);
                    }
                } catch (\Exception $e) {
                    // Swallow and continue
                }
            }
        } else {
            if ($deleteFromStorage && $this->path) {
                try {
                    Storage::disk($this->disk ?? $this->defaultDisk)->delete($this->path);
                } catch (\Exception $e) {
                    // Swallow and continue
                }
            }
        }

        return $this->delete();
    }

    public static function deleteFiles(array $ids, bool $deleteFromStorage = true): bool
    {
        $deleted = true;

        foreach ($ids as $id) {
            try {
                $media = static::find($id);
                if ($media) {
                    $media->deleteFile($deleteFromStorage);
                }
            } catch (\Exception $e) {
                $deleted = false;
            }
        }

        return $deleted;
    }

    public static function createFolder(string $folderName, ?int $parentId = null, ?string $disk = null): self
    {
        $disk = $disk ?? 'public';
        $storage = Storage::disk($disk);

        $folderPath = '';
        if ($parentId) {
            $parent = self::find($parentId);
            if ($parent && $parent->type === 'folder') {
                $folderPath = rtrim($parent->path, '/');
            }
        }
        $fullPath = $folderPath ? $folderPath.'/'.$folderName : $folderName;

        if (method_exists($storage, 'makeDirectory')) {
            $storage->makeDirectory($fullPath);
        } else {
            $storage->put($fullPath.'/.gitkeep', '');
        }

        $media = new self;
        $absoluteUrl = $media->buildUrl($fullPath, $disk);

        $media = new self([
            'name' => $folderName,
            'path' => $fullPath,
            'type' => 'folder',
            'parent_id' => $parentId,
            'size' => 0,
            'mime_type' => 'directory',
            'extension' => null,
            'hash' => null,
            'disk' => $disk,
            'absolute_url' => $absoluteUrl,
        ]);

        $media->save();

        return $media;
    }

    public function rename(string $newName): bool
    {
        if (! $this->path) {
            return false;
        }

        $storage = Storage::disk($this->disk ?? $this->defaultDisk);

        try {
            if ($this->type === 'folder') {
                $directory = dirname($this->path);
                $newPath = $directory !== '.'
                    ? $directory.'/'.$newName
                    : $newName;

                if ($storage->exists($this->path)) {
                    $files = $storage->allFiles($this->path);
                    foreach ($files as $file) {
                        $relativePath = str_replace($this->path.'/', '', $file);
                        $newFilePath = $newPath.'/'.$relativePath;
                        $storage->move($file, $newFilePath);

                        $child = static::where('path', $file)->first();
                        if ($child) {
                            $child->path = $newFilePath;
                            $child->save();
                        }
                    }

                    if (method_exists($storage, 'deleteDirectory')) {
                        $storage->deleteDirectory($this->path);
                    }
                }

                $this->path = $newPath;
                $this->name = $newName;
                $this->absolute_url = $this->buildUrl($newPath, $this->disk ?? $this->defaultDisk);
                $this->save();

                return true;
            }

            $directory = dirname($this->path);
            $extension = $this->extension;

            if (! pathinfo($newName, PATHINFO_EXTENSION) && $extension) {
                $newName .= '.'.$extension;
            }

            $newPath = $directory !== '.'
                ? $directory.'/'.$newName
                : $newName;

            if ($storage->exists($this->path)) {
                $storage->move($this->path, $newPath);

                $this->path = $newPath;
                $this->name = $newName;
                $this->absolute_url = $this->buildUrl($newPath, $this->disk ?? $this->defaultDisk);
                $this->save();

                return true;
            }

            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function move(?int $newParentId = null): bool
    {
        if (! $this->path) {
            return false;
        }

        $storage = Storage::disk($this->disk ?? $this->defaultDisk);

        try {
            $newParentPath = '';
            if ($newParentId) {
                $newParent = static::find($newParentId);
                if ($newParent && $newParent->type === 'folder') {
                    $newParentPath = rtrim($newParent->path, '/');
                }
            }

            $fileName = basename($this->path);
            $newPath = $newParentPath ? $newParentPath.'/'.$fileName : $fileName;

            if ($this->type === 'folder') {
                if ($storage->exists($this->path)) {
                    $files = $storage->allFiles($this->path);
                    foreach ($files as $file) {
                        $relativePath = str_replace($this->path.'/', '', $file);
                        $newFilePath = $newPath.'/'.$relativePath;
                        $storage->move($file, $newFilePath);

                        $child = static::where('path', $file)->first();
                        if ($child) {
                            $oldPath = $child->path;
                            $child->path = $newFilePath;
                            $child->parent_id = $this->id;
                            $child->absolute_url = $this->buildUrl($newFilePath, $child->disk ?? $this->defaultDisk);
                            $child->save();

                            $this->updateChildrenPaths($oldPath, $newFilePath);
                        }
                    }

                    if (method_exists($storage, 'deleteDirectory')) {
                        $storage->deleteDirectory($this->path);
                    }
                }
            } else {
                if ($storage->exists($this->path)) {
                    $storage->move($this->path, $newPath);
                }
            }

            $this->path = $newPath;
            $this->parent_id = $newParentId;
            $this->absolute_url = $this->buildUrl($newPath, $this->disk ?? $this->defaultDisk);
            $this->save();

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    protected function updateChildrenPaths(string $oldPath, string $newPath): void
    {
        $children = static::where('parent_id', $this->id)->get();
        foreach ($children as $child) {
            $childPath = str_replace($oldPath, $newPath, $child->path);
            $child->path = $childPath;
            $child->absolute_url = $this->buildUrl($childPath, $child->disk ?? $this->defaultDisk);
            $child->save();

            if ($child->type === 'folder') {
                $child->updateChildrenPaths($oldPath, $newPath);
            }
        }
    }

    public function duplicate(?string $newName = null, ?int $targetParentId = null): ?self
    {
        $storage = Storage::disk($this->disk ?? $this->defaultDisk);

        try {
            $newName = $newName ?? $this->name;

            $targetParentPath = '';
            if ($targetParentId) {
                $targetParent = static::find($targetParentId);
                if ($targetParent && $targetParent->type === 'folder') {
                    $targetParentPath = rtrim($targetParent->path, '/');
                }
            } elseif ($this->parent_id) {
                $parent = $this->parent;
                if ($parent) {
                    $targetParentPath = rtrim($parent->path, '/');
                }
            }

            $newPath = $targetParentPath ? $targetParentPath.'/'.$newName : $newName;

            if ($this->type === 'folder') {
                if ($storage->exists($this->path)) {
                    $files = $storage->allFiles($this->path);
                    foreach ($files as $file) {
                        $relativePath = str_replace($this->path.'/', '', $file);
                        $newFilePath = $newPath.'/'.$relativePath;
                        $storage->copy($file, $newFilePath);
                    }
                }

                $newMedia = new self([
                    'name' => $newName,
                    'path' => $newPath,
                    'type' => 'folder',
                    'parent_id' => $targetParentId ?? $this->parent_id,
                    'size' => 0,
                    'mime_type' => 'directory',
                    'extension' => null,
                    'hash' => null,
                    'disk' => $this->disk,
                    'absolute_url' => $this->buildUrl($newPath, $this->disk),
                ]);

                $newMedia->save();

                $children = $this->children;
                foreach ($children as $child) {
                    $child->duplicate(null, $newMedia->id);
                }

                return $newMedia;
            }

            if ($storage->exists($this->path)) {
                $storage->copy($this->path, $newPath);
            }

            $newMedia = new self([
                'name' => $newName,
                'path' => $newPath,
                'type' => 'file',
                'parent_id' => $targetParentId ?? $this->parent_id,
                'size' => $this->size,
                'mime_type' => $this->mime_type,
                'extension' => $this->extension,
                'hash' => $this->hash,
                'disk' => $this->disk,
                'absolute_url' => $this->buildUrl($newPath, $this->disk),
            ]);
            $newMedia->save();

            return $newMedia;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function getFormattedSizeAttribute(): string
    {
        if ($this->type === 'folder') {
            return '-';
        }

        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }

    public function toArray(): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'path' => $this->path,
            'absolute_url' => $this->absolute_url,
            'parent_id' => $this->parent_id ? (string) $this->parent_id : null,
            'size' => $this->formatted_size,
            'extension' => $this->extension ?? null,
            'mime_type' => $this->mime_type ?? null,
            'createdAt' => $this->created_at->format('H:i d/m/Y'),
        ];
    }
}
