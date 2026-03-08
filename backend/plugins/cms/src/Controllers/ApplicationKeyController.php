<?php

namespace PS0132E282\Cms\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use PS0132E282\Cms\Models\ApplicationKey;
use Spatie\Permission\Models\Permission;

class ApplicationKeyController extends \Illuminate\Routing\Controller
{
    public function index()
    {
        $keys = ApplicationKey::query()
            ->select('id', 'name', 'last_used_at', 'created_at', 'user_id')
            ->with(['user:id,name', 'permissions'])
            ->latest()
            ->get();

        if (request()->wantsJson()) {
            return response()->json([
                'items' => $keys,
            ]);
        }

        $permissions = Permission::select('name', 'id', 'group')
            ->where('group', 'api')
            ->get()
            ->groupBy('group');

        return Inertia::render('cms/settings/application_keys', [
            'applicationKeys' => $keys,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $plainToken = Str::random(64);

        ApplicationKey::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'token_hash' => hash('sha256', $plainToken),
        ]);

        return redirect()->route('admin.settings.application-keys.index')
            ->with('success', 'Tạo khóa API thành công. Token: ' . $plainToken);
    }

    public function update($id, Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        ApplicationKey::findOrFail($id)->update([
            'name' => $request->name,
        ]);

        return redirect()->route('admin.settings.application-keys.index');
    }

    public function permissions($id, Request $request)
    {
        $request->validate([
            'permissions' => 'nullable|array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);

        $key = ApplicationKey::findOrFail($id);
        $permissionIds = $request->permissions ?? [];

        if (empty($permissionIds)) {
            $key->permissions()->detach();
        } else {
            $permissions = Permission::whereIn('id', $permissionIds)->get();
            $key->syncPermissions($permissions);
        }

        return redirect()->route('admin.settings.application-keys.index');
    }

    public function destroy($id)
    {
        ApplicationKey::findOrFail($id)->delete();

        return redirect()->route('admin.settings.application-keys.index');
    }
}
