<?php

namespace PS0132E282\Notifications\Services;

use App\Models\User;
use Illuminate\Support\Str;
use PS0132E282\Notifications\Events\NotificationSent;

class NotificationService
{
  /**
   * Send a notification to a user.
   */
  public function send(User $user, array $data)
  {
    // 1. Save to database
    $notification = $user->notifications()->create([
      'id' => Str::uuid(),
      'type' => 'system',
      'data' => $data,
      'read_at' => null,
    ]);

    // 2. Broadcast realtime
    broadcast(new NotificationSent($user->id, array_merge($data, ['id' => $notification->id])));

    return $notification;
  }
}
