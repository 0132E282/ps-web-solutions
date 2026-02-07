<?php

namespace PS0132E282\CMS\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Redirect to OAuth provider
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function redirectToProvider(string $provider)
    {
        return Socialite::driver($provider)->redirect();
    }

    /**
     * Handle OAuth provider callback
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function handleProviderCallback(string $provider)
    {
        try {
            $socialUser = Socialite::driver($provider)->user();

            // Find user by email
            $user = User::where('email', $socialUser->getEmail())->first();

            if (! $user) {
                // Create new user if doesn't exist
                $user = User::create([
                    'name' => $socialUser->getName(),
                    'email' => $socialUser->getEmail(),
                    'password' => Hash::make(Str::random(24)),
                    'email_verified_at' => now(),
                ]);
            }

            // Ensure social link exists
            $socialAccount = DB::table('social_accounts')
                ->where('account_id', $user->id)
                ->where('provider', $provider)
                ->first();

            if (! $socialAccount) {
                DB::table('social_accounts')->insert([
                    'account_id' => $user->id,
                    'provider' => $provider,
                    'provider_id' => $socialUser->getId(),
                    'email' => $socialUser->getEmail(),
                    'avatar' => $socialUser->getAvatar(),
                    'type' => 'admin',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                // Update avatar if changed
                DB::table('social_accounts')
                    ->where('id', $socialAccount->id)
                    ->update([
                        'provider_id' => $socialUser->getId(),
                        'avatar' => $socialUser->getAvatar(),
                        'updated_at' => now(),
                    ]);
            }

            // Login the user
            Auth::login($user, true);

            // Redirect to dashboard
            return redirect()->intended(route('dashboard'));
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', "Unable to authenticate with {$provider}.");
        }
    }
}
