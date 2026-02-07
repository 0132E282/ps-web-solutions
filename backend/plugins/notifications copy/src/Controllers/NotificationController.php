<?php

namespace PS0132E282\Notifications\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Display a listing of notifications.
     */
    public function index()
    {
        return Inertia::render('notifications/index', [
            'notifications' => auth()->user()->notifications()->latest()->paginate(20),
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead($id)
    {
        auth()->user()->unreadNotifications->where('id', $id)->markAsRead();

        return back()->with('success', 'Đã đánh dấu là đã đọc');
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        auth()->user()->unreadNotifications->markAsRead();

        return back()->with('success', 'Đã đánh dấu tất cả là đã đọc');
    }

    /**
     * Remove a notification.
     */
    public function destroy($id)
    {
        auth()->user()->notifications()->where('id', $id)->delete();

        return back()->with('success', 'Đã xóa thông báo');
    }

    /**
     * Remove all notifications.
     */
    public function destroyAll()
    {
        auth()->user()->notifications()->delete();

        return back()->with('success', 'Đã xóa tất cả thông báo');
    }
}
