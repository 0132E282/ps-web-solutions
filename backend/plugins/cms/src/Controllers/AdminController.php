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
                'name',
                ['name' => 'email', 'width' => 12],
                'roles.name',
                'created_at',
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
                            'roles',
                            'status',
                        ],
                    ],
                ],
            ],
        ],
    ];

    public function store(Request $request)
    {
        $request->merge([
            'password' => Hash::make($request->input('password')),
        ]);

        $request->request->remove('confirm_password');

        return parent::store($request);
    }

    public function update($id, Request $request)
    {
        if ($request->filled('password')) {
            $request->merge([
                'password' => Hash::make($request->input('password')),
            ]);
            $request->request->remove('confirm_password');
        } else {
            $request->request->remove('password');
            $request->request->remove('confirm_password');
        }

        return parent::update($id, $request);
    }

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
