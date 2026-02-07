<?php

namespace PS0132E282\CMS\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Features;

class AuthController extends Controller
{
    /**
     * Show the admin login form
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function showLogin(Request $request)
    {
        return Inertia::render('cms/auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'canRegister' => Features::enabled(Features::registration()),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Show the admin two-factor challenge form
     *
     * @return \Inertia\Response
     */
    public function showTwoFactorChallenge()
    {
        return Inertia::render('cms/auth/two-factor-challenge');
    }

    /**
     * Show the password confirmation form
     *
     * @return \Inertia\Response
     */
    public function showConfirmPassword()
    {
        return Inertia::render('cms/auth/confirm-password');
    }

    /**
     * Show the email verification notice
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function showVerifyEmail(Request $request)
    {
        return Inertia::render('cms/auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Show the reset password form
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function showResetPassword(Request $request)
    {
        return Inertia::render('cms/auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Show the forgot password form
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function showForgotPassword(Request $request)
    {
        return Inertia::render('cms/auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Show the registration form
     *  
     * @return \Inertia\Response
     */
    public function showRegister()
    {
        return Inertia::render('cms/auth/register');
    }
}
