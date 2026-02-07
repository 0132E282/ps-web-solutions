<?php

namespace PS0132E282\Cms\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PS0132E282\Core\Base\BaseController;
use PS0132E282\Cms\Models\ApplicationKey;
use Spatie\Permission\Models\Permission;
use PS0132E282\Core\Services\PermissionService;

class ApplicationKeyController extends \Illuminate\Routing\Controller
{
    protected PermissionService $permissionService;

    public function __construct(PermissionService $permissionService)
    {
        $this->permissionService = $permissionService;
    }
  public function index()
  {
    $keys = ApplicationKey::query()
      ->select('id', 'name', 'last_used_at', 'created_at', 'user_id')
      ->with(['user:id,name', 'permissions']) // Include permissions
      ->latest()
      ->get();

    if (request()->wantsJson()) {
      return response()->json([
        'items' => $keys,
      ]);
    }

    // Add a permission with group 'api' if it doesn't exist
    Permission::firstOrCreate(
        ['name' => 'api.access'],
        ['group' => 'api', 'guard_name' => 'api', 'description' => 'Access API']
    );

    $permissions = Permission::where('guard_name', 'api')->get()->groupBy('group');

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
      ->with('flash', [
        'type' => 'success',
        'message' => 'Application key created successfully.',
        'token' => $plainToken,
      ]);
  }

  public function update($id, Request $request)
  {
    $request->validate([
      'name' => 'required|string|max:255',
    ]);

    $key = ApplicationKey::findOrFail($id);
    $key->update([
      'name' => $request->name,
    ]);

    return redirect()->route('admin.settings.application-keys.index')
      ->with('flash', [
        'type' => 'success',
        'message' => 'Application key updated successfully.',
      ]);
  }

  public function destroy($id)
  {
    ApplicationKey::findOrFail($id)->delete();

    return redirect()->route('admin.settings.application-keys.index')
      ->with('flash', [
        'type' => 'success',
        'message' => 'Application key deleted successfully.',
      ]);
  }
}
