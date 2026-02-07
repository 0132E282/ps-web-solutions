<?php

namespace PS0132E282\Cms\Controllers;

use App\Http\Controllers\Controller;

use Inertia\Inertia;

use Carbon\Carbon;
use Spatie\Analytics\Facades\Analytics;
use Spatie\Analytics\Period;
use Illuminate\Support\Facades\File;

class SiteController extends Controller
{
    public function index()
    {
        $analyticsConfigured = false;
        $analyticsData = [
            'totalVisitors' => 0,
            'pageViews' => 0,
            'bounceRate' => 0,
            'avgSessionDuration' => 0,
        ];

        try {
            // Check if configuration exists
            $credentialsFile = config('analytics.service_account_credentials_json');
            $propertyId = config('analytics.property_id');

            if ($propertyId && File::exists($credentialsFile)) {
                $analyticsConfigured = true;

                // Fetch Total Visitors and PageViews for last 30 days
                $totalVisitorsAndPageViews = Analytics::fetchTotalVisitorsAndPageViews(Period::days(30));

                // Sum them up for the summary cards
                $analyticsData['totalVisitors'] = $totalVisitorsAndPageViews->sum('activeUsers');
                $analyticsData['pageViews'] = $totalVisitorsAndPageViews->sum('screenPageViews');

                // You can add more metrics here like Bounce Rate using custom queries if needed
                // For now we keep it simple with standard methods
            }
        } catch (\Exception $e) {
            // Silently fail or log error, but don't crash the dashboard
            // Log::error($e->getMessage());
            $analyticsConfigured = false;
        }

        $websiteData = [
            'totalProducts' => 0,
            'totalCategories' => 0,
            'totalPosts' => 0,
        ];

        return Inertia::render('cms/dashboard/index', [
            'analyticsConfigured' => $analyticsConfigured,
            'analyticsData' => $analyticsData,
            'websiteData' => $websiteData
        ]);
    }
}
