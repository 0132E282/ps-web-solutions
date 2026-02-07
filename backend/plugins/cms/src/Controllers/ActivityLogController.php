<?php

namespace PS0132E282\Cms\Controllers;

use Inertia\Inertia;
use PS0132E282\Core\Base\BaseController;
use PS0132E282\Cms\Models\Activity;

class ActivityLogController extends BaseController
{
  public function index()
  {
    $request = request();
    $query = Activity::with('causer')->latest();

    if ($request->filled('search')) {
      $search = $request->input('search');
      $query->where(function ($q) use ($search) {
        $q->where('description', 'like', "%{$search}%")
          ->orWhere('event', 'like', "%{$search}%")
          ->orWhere('log_name', 'like', "%{$search}%")
          ->orWhereHas('causer', function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
          });
      });
    }

    if ($request->filled('event') && $request->input('event') !== 'all') {
      $query->where('event', $request->input('event'));
    }

    if ($request->filled('date_from')) {
      $query->whereDate('created_at', '>=', $request->input('date_from'));
    }

    if ($request->filled('date_to')) {
      $query->whereDate('created_at', '<=', $request->input('date_to'));
    }

    $activities = $query->paginate(20)->withQueryString();

    return Inertia::render('cms/settings/activity_logs', [
      'activities' => $activities,
      'filters' => $request->only(['search', 'event', 'date_from', 'date_to']),
    ]);
  }
}
