<?php

namespace PS0132E282\Cms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use PS0132E282\Core\Models\Media;
use ZipArchive;

class FileController extends Controller
{
    public function index(Request $request)
    {
        $parentId = $request->get('parent_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $query = Media::query();

        if ($parentId) {
            $query->where('parent_id', $parentId);
        } else {
            $query->whereNull('parent_id');
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $allowedSorts = ['name', 'size', 'created_at'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('name', $sortOrder);
        }

        $items = $query->get()->toArray();

        $breadcrumbs = [
            [
                'title' => 'Dashboard',
                'href' => '/',
            ],
            [
                'title' => 'Files',
                'href' => route('admin.files.index'),
            ],
        ];

        if ($parentId) {
            $currentFolder = Media::find($parentId);
            $path = [];

            $folder = $currentFolder;
            while ($folder) {
                array_unshift($path, [
                    'id' => (string) $folder->id,
                    'name' => $folder->name,
                ]);
                $folder = $folder->parent;
            }

            foreach ($path as $folder) {
                $breadcrumbs[] = [
                    'title' => $folder['name'],
                    'href' => route('admin.files.index', ['parent_id' => $folder['id']]),
                ];
            }
        }

        if ($request->wantsJson()) {
            return response()->json([
                'items' => $items,
                'breadcrumbs' => $breadcrumbs,
            ]);
        }

        // Sử dụng page riêng của plugin CMS
        return Inertia::render('cms/files/index', [
            'items' => $items,
            'parentId' => $parentId,
            'breadcrumbs' => $breadcrumbs,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'file|max:10240',
            'parent_id' => 'nullable|integer|exists:media,id',
        ]);

        $parentId = $request->get('parent_id');
        $uploadedFiles = [];

        foreach ($request->file('files') as $file) {
            try {
                $media = Media::uploadFile($file, $parentId);
                $uploadedFiles[] = [
                    'id' => (string) $media->id,
                    'name' => $media->name,
                    'type' => $media->type,
                    'path' => $media->path,
                    'absolute_url' => $media->absolute_url,
                    'size' => $media->formatted_size,
                    'createdAt' => $media->created_at->format('H:i d/m/Y'),
                ];
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Lỗi khi tải file: '.$e->getMessage(),
                ], 500);
            }
        }

        return response()->json([
            'message' => 'Tải file thành công',
            'files' => $uploadedFiles,
        ]);
    }

    public function createFolder(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|integer|exists:media,id',
        ]);

        try {
            $media = Media::createFolder($request->name, $request->parent_id);

            return response()->json([
                'message' => 'Tạo thư mục thành công',
                'folder' => [
                    'id' => (string) $media->id,
                    'name' => $media->name,
                    'type' => $media->type,
                    'size' => $media->formatted_size,
                    'createdAt' => $media->created_at->format('H:i d/m/Y'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi tạo thư mục: '.$e->getMessage(),
            ], 500);
        }
    }

    public function rename(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $media = Media::findOrFail($id);

        try {
            $media->rename($request->name);

            return response()->json([
                'message' => 'Đổi tên thành công',
                'item' => [
                    'id' => (string) $media->id,
                    'name' => $media->name,
                    'type' => $media->type,
                    'path' => $media->path,
                    'absolute_url' => $media->absolute_url,
                    'size' => $media->formatted_size,
                    'createdAt' => $media->created_at->format('H:i d/m/Y'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi đổi tên: '.$e->getMessage(),
            ], 500);
        }
    }

    public function move(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:media,id',
            'parent_id' => 'nullable|integer|exists:media,id',
        ]);

        $ids = $request->get('ids');
        $parentId = $request->get('parent_id');

        try {
            foreach ($ids as $id) {
                $media = Media::findOrFail($id);
                $media->move($parentId);
            }

            return response()->json([
                'message' => 'Di chuyển thành công',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi di chuyển: '.$e->getMessage(),
            ], 500);
        }
    }

    public function duplicate(Request $request, $id)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'parent_id' => 'nullable|integer|exists:media,id',
        ]);

        $media = Media::findOrFail($id);

        try {
            $newMedia = $media->duplicate($request->name, $request->parent_id);

            if (! $newMedia) {
                return response()->json([
                    'message' => 'Lỗi khi sao chép',
                ], 500);
            }

            return response()->json([
                'message' => 'Sao chép thành công',
                'item' => [
                    'id' => (string) $newMedia->id,
                    'name' => $newMedia->name,
                    'type' => $newMedia->type,
                    'path' => $newMedia->path,
                    'absolute_url' => $newMedia->absolute_url,
                    'size' => $newMedia->formatted_size,
                    'createdAt' => $newMedia->created_at->format('H:i d/m/Y'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi sao chép: '.$e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:media,id',
        ]);

        $ids = $request->get('ids');

        try {
            Media::deleteFiles($ids);

            return response()->json([
                'message' => 'Xóa thành công',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi xóa: '.$e->getMessage(),
            ], 500);
        }
    }

    public function download($id)
    {
        $media = Media::findOrFail($id);

        if ($media->type === 'folder') {
            return response()->json([
                'message' => 'Không thể tải xuống thư mục',
            ], 400);
        }

        $storage = Storage::disk($media->disk ?? 'public');

        if (! $storage->exists($media->path)) {
            return response()->json([
                'message' => 'File không tồn tại',
            ], 404);
        }

        return response()->download($storage->path($media->path), $media->name);
    }

    public function downloadZip(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:media,id',
        ]);

        $ids = $request->get('ids');
        $items = Media::whereIn('id', $ids)->get();

        if ($items->isEmpty()) {
            return response()->json([
                'message' => 'Không có file nào để tải xuống',
            ], 400);
        }

        $zipFileName = 'files_'.time().'.zip';
        $zipPath = storage_path('app/temp/'.$zipFileName);

        if (! file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
            return response()->json([
                'message' => 'Không thể tạo file ZIP',
            ], 500);
        }

        foreach ($items as $item) {
            if ($item->type === 'file') {
                $storage = Storage::disk($item->disk ?? 'public');
                if ($storage->exists($item->path)) {
                    $zip->addFromString($item->name, $storage->get($item->path));
                }
            } elseif ($item->type === 'folder') {
                $this->addFolderToZip($zip, $item, '');
            }
        }

        $zip->close();

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }

    protected function addFolderToZip(ZipArchive $zip, Media $folder, string $basePath): void
    {
        $children = $folder->children;

        foreach ($children as $child) {
            $currentPath = $basePath ? $basePath.'/'.$child->name : $child->name;

            if ($child->type === 'file') {
                $storage = Storage::disk($child->disk ?? 'public');
                if ($storage->exists($child->path)) {
                    $zip->addFromString($currentPath, $storage->get($child->path));
                }
            } elseif ($child->type === 'folder') {
                $zip->addEmptyDir($currentPath);
                $this->addFolderToZip($zip, $child, $currentPath);
            }
        }
    }

    public function compress(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:media,id',
            'name' => 'nullable|string|max:255',
        ]);

        $ids = $request->get('ids');
        $zipName = $request->get('name', 'archive_'.time().'.zip');

        if (! Str::endsWith($zipName, '.zip')) {
            $zipName .= '.zip';
        }

        $items = Media::whereIn('id', $ids)->get();

        if ($items->isEmpty()) {
            return response()->json([
                'message' => 'Không có file nào để nén',
            ], 400);
        }

        $storage = Storage::disk('public');
        $zipPath = 'compressed/'.$zipName;

        if (! $storage->exists('compressed')) {
            $storage->makeDirectory('compressed');
        }

        $tempZipPath = storage_path('app/temp/'.$zipName);

        if (! file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        $zip = new ZipArchive;
        if ($zip->open($tempZipPath, ZipArchive::CREATE) !== true) {
            return response()->json([
                'message' => 'Không thể tạo file ZIP',
            ], 500);
        }

        foreach ($items as $item) {
            if ($item->type === 'file') {
                $itemStorage = Storage::disk($item->disk ?? 'public');
                if ($itemStorage->exists($item->path)) {
                    $zip->addFromString($item->name, $itemStorage->get($item->path));
                }
            } elseif ($item->type === 'folder') {
                $this->addFolderToZip($zip, $item, '');
            }
        }

        $zip->close();

        $storage->put($zipPath, file_get_contents($tempZipPath));
        unlink($tempZipPath);

        $mediaHelper = new Media;
        $absoluteUrl = $mediaHelper->buildUrl($zipPath, 'public');

        $media = Media::create([
            'name' => $zipName,
            'path' => $zipPath,
            'type' => 'file',
            'parent_id' => $items->first()->parent_id,
            'size' => $storage->size($zipPath),
            'mime_type' => 'application/zip',
            'extension' => 'zip',
            'hash' => hash_file('sha256', $storage->path($zipPath)),
            'disk' => 'public',
            'absolute_url' => $absoluteUrl,
        ]);

        return response()->json([
            'message' => 'Nén thành công',
            'item' => [
                'id' => (string) $media->id,
                'name' => $media->name,
                'type' => $media->type,
                'size' => $media->formatted_size,
                'createdAt' => $media->created_at->format('H:i d/m/Y'),
            ],
        ]);
    }

    public function extract(Request $request, $id)
    {
        $media = Media::findOrFail($id);

        if ($media->type !== 'file' || ! in_array($media->extension, ['zip', 'rar', '7z'], true)) {
            return response()->json([
                'message' => 'File không phải là file nén',
            ], 400);
        }

        $storage = Storage::disk($media->disk ?? 'public');

        if (! $storage->exists($media->path)) {
            return response()->json([
                'message' => 'File không tồn tại',
            ], 404);
        }

        if ($media->extension !== 'zip') {
            return response()->json([
                'message' => 'Chỉ hỗ trợ file ZIP',
            ], 400);
        }

        $tempZipPath = storage_path('app/temp/'.basename($media->path));

        if (! file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        file_put_contents($tempZipPath, $storage->get($media->path));

        $zip = new ZipArchive;
        if ($zip->open($tempZipPath) !== true) {
            unlink($tempZipPath);

            return response()->json([
                'message' => 'Không thể mở file ZIP',
            ], 500);
        }

        $extractPath = dirname($media->path).'/'.pathinfo($media->name, PATHINFO_FILENAME);

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $filename = $zip->getNameIndex($i);
            if ($filename === false) {
                continue;
            }

            $fileContent = $zip->getFromIndex($i);
            if ($fileContent === false) {
                continue;
            }

            $filePath = $extractPath.'/'.$filename;
            $storage->put($filePath, $fileContent);

            $fileInfo = pathinfo($filename);
            $mediaHelper = new Media;
            $absoluteUrl = $mediaHelper->buildUrl($filePath, $media->disk);

            Media::create([
                'name' => $fileInfo['basename'],
                'path' => $filePath,
                'type' => $fileInfo['extension'] ? 'file' : 'folder',
                'parent_id' => $media->parent_id,
                'size' => strlen($fileContent),
                'mime_type' => $fileInfo['extension'] ? mime_content_type($filePath) : 'directory',
                'extension' => $fileInfo['extension'] ?? null,
                'hash' => hash('sha256', $fileContent),
                'disk' => $media->disk,
                'absolute_url' => $absoluteUrl,
            ]);
        }

        $zip->close();
        unlink($tempZipPath);

        return response()->json([
            'message' => 'Giải nén thành công',
        ]);
    }

    public function getFoldersTree(Request $request)
    {
        $excludeIds = $request->get('exclude_ids', []);
        if (! is_array($excludeIds)) {
            $excludeIds = [];
        }

        $folders = Media::where('type', 'folder')
            ->whereNotIn('id', $excludeIds)
            ->orderBy('name', 'asc')
            ->get();

        $buildTree = function ($parentId = null) use (&$buildTree, $folders) {
            return $folders
                ->filter(function ($folder) use ($parentId) {
                    $folderParentId = $folder->parent_id;

                    return ($parentId === null && $folderParentId === null)
                        || ($parentId !== null && $folderParentId !== null && (string) $folderParentId === (string) $parentId);
                })
                ->map(function ($folder) use (&$buildTree) {
                    return [
                        'id' => (string) $folder->id,
                        'name' => $folder->name,
                        'parent_id' => $folder->parent_id ? (string) $folder->parent_id : null,
                        'children' => $buildTree($folder->id),
                    ];
                })
                ->values()
                ->toArray();
        };

        $tree = $buildTree(null);

        return response()->json([
            'folders' => $tree,
        ]);
    }
}
