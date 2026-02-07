<?php

namespace PS0132E282\Cms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    /**
     * Show the change password page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('cms/account/change-password');
    }

    /**
     * Update the user's password.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->route('admin.account.change-password')->with('success', 'Đổi mật khẩu thành công!');
    }
}
