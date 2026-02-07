<?php

namespace PS0132E282\Cms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::select('name', 'id')->with('permissions')->get();
        if (request()->wantsJson()) {
            return response()->json([
                'items' => $roles,
            ]);
        }

        $permissions = Permission::select('name', 'id', 'group')->get()->groupBy('group');

        return Inertia::render('cms/settings/roles', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
        ]);

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => 'web',
        ]);

        return Inertia::location(route('admin.settings.roles.index'));
    }

    public function permissions(int $id, Request $request)
    {
        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);

        $role = Role::findOrFail($id);
        $role->syncPermissions($request->permissions);

        return Inertia::location(route('admin.settings.roles.index'));
    }

    public function update(int $id, Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,'.$id,
        ]);

        $role = Role::findOrFail($id);

        $role->update(['name' => $request->name]);

        return Inertia::location(route('admin.settings.roles.index'));
    }

    public function destroy(int $id)
    {
        Role::findOrFail($id)->delete();

        return Inertia::location(route('admin.settings.roles.index'));
    }
}
