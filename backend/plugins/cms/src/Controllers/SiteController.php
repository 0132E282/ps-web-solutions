<?php

namespace PS0132E282\Cms\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Spatie\Analytics\Facades\Analytics;
use Spatie\Analytics\Period;

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

        // E-commerce Data Initialization
        $ecommerceData = [
            'totalSales' => 0,
            'totalOrders' => 0,
            'recentOrders' => [],
            'salesChart' => [],
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

        // Fetch E-commerce Data if Order model exists
        if (class_exists('PS0132E282\ECommerce\Models\Order')) {
            try {
                $ecommerceData['totalSales'] = \PS0132E282\ECommerce\Models\Order::sum('total');
                $ecommerceData['totalOrders'] = \PS0132E282\ECommerce\Models\Order::count();

                $recentOrders = \PS0132E282\ECommerce\Models\Order::latest()
                    ->take(5)
                    ->get()
                    ->map(function ($order) {
                        return [
                            'id' => $order->id,
                            'order_number' => $order->order_number,
                            'customer_name' => $order->getCustomerFullName(),
                            'email' => $order->customer_email,
                            'total' => (float) $order->total,
                            'status' => $order->status,
                            'created_at' => $order->created_at->diffForHumans(),
                        ];
                    });

                $ecommerceData['recentOrders'] = $recentOrders;

                // Simple sales chart data (last 7 days)
                $salesChart = \PS0132E282\ECommerce\Models\Order::selectRaw('DATE(created_at) as date, SUM(total) as sales, COUNT(*) as orders')
                    ->where('created_at', '>=', Carbon::now()->subDays(7))
                    ->groupBy('date')
                    ->orderBy('date')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'date' => $item->date,
                            'formatted_date' => Carbon::parse($item->date)->format('d/m'),
                            'sales' => (float) $item->sales,
                            'orders' => (int) $item->orders,
                        ];
                    });

                $ecommerceData['salesChart'] = $salesChart;
            } catch (\Exception $e) {
                // Log error if needed, but ensure dashboard still loads
            }
        }

        return Inertia::render('cms/dashboard/index', [
            'analyticsConfigured' => $analyticsConfigured,
            'adsConfigured' => false,
            'searchConsoleConfigured' => false,
            'analyticsData' => $analyticsData,
            'ecommerceData' => $ecommerceData,
        ]);
    }

    public function analytics()
    {
        $analyticsConfigured = false;
        try {
            $credentialsFile = config('analytics.service_account_credentials_json');
            $propertyId = config('analytics.property_id');
            if ($propertyId && File::exists($credentialsFile)) {
                $analyticsConfigured = true;
            }
        } catch (\Exception $e) {
            $analyticsConfigured = false;
        }

        return Inertia::render('cms/dashboard/analytics', [
            'analyticsConfigured' => $analyticsConfigured,
        ]);
    }

    public function ads()
    {
        return Inertia::render('cms/dashboard/ads', [
            'adsConfigured' => false,
        ]);
    }

    public function searchConsole()
    {
        return Inertia::render('cms/dashboard/search-console', [
            'searchConsoleConfigured' => false,
        ]);
    }

    public function getUrlFrontend()
    {
        return response()->json([
            'url' => config('app.url'),
        ]);
    }
}
