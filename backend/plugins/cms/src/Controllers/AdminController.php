<?php

namespace PS0132E282\Cms\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use PS0132E282\Cms\Models\Admin;
use PS0132E282\Core\Base\BaseController;

class AdminController extends BaseController
{
    protected ?string $model = Admin::class;

    const views = [
        'index' => [
            'title' => 'Admins',
            'description' => 'List of admins',
            'icon' => 'Users',
            'filters' => [
                ['name' => 'roles', 'type' => 'select'],
            ],
            'fields' => [
                ['name' => 'name', 'config' => ['primary' => true]], 'email', 'roles', 'status', ['name' => 'created_at', 'config' => ['type' => 'date']],
            ],
            'actions' => [
                'duplicate' => false,
            ],
        ],
        'form' => [
            'title' => 'Admin',
            'description' => 'Admin details',
            'icon' => 'Users',
            'route' => 'admin.admins.store',
            'sections' => [
                'main' => [
                    [
                        'header' => [
                            'title' => 'Admin Details',
                            'description' => 'Admin details',
                        ],
                        'fields' => [
                            'name',
                            'email',
                            ['name' => 'password', 'config' => ['width' => 'md']],
                            ['name' => 'confirm_password', 'config' => ['width' => 'md']],
                            'roles',
                        ],
                    ],
                ],
                'sidebar' => [
                    [
                        'header' => [
                            'title' => 'configuration',
                            'description' => 'configuration',
                        ],
                        'fields' => [
                            ['name' => 'status'],
                        ],
                    ],
                ],
            ],
        ],
    ];

    public function updatePassword($id, Request $request)
    {
        $admin = $this->model::query()->findOrFail($id);

        $validated = $request->validate([
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $admin->update([
            'password' => Hash::make($validated['password']),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Mật khẩu đã được cập nhật thành công',
            ]);
        }

        return back()->with('success', 'Mật khẩu đã được cập nhật thành công');
    }
}
