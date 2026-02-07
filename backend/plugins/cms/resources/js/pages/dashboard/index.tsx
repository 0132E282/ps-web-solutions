import AppLayout from "@core/layouts/app-layout";
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@core/components/ui/card";
import { Button } from "@core/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@core/components/ui/alert";
import { Activity, Users, Eye, Clock, ArrowUpRight, ArrowDownRight, BarChart3, TrendingUp, Info, ShoppingBag, FolderTree, FileText } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";

interface AnalyticsData {
    totalVisitors: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
}

interface WebsiteData {
    totalProducts: number;
    totalCategories: number;
    totalPosts: number;
}

interface PageProps {
    analyticsConfigured: boolean;
    analyticsData: AnalyticsData;
    websiteData: WebsiteData;
    [key: string]: unknown;
}

// Mock data for fallback
const mockStats = [
    {
        title: "Total Page Views",
        value: "24,532",
        change: "+12.5%",
        trend: "up",
        icon: Eye,
    },
    {
        title: "Unique Visitors",
        value: "8,245",
        change: "+18.2%",
        trend: "up",
        icon: Users,
    },
    {
        title: "Avg. Time on Page",
        value: "2m 14s",
        change: "-3.1%",
        trend: "down",
        icon: Clock,
    },
    {
        title: "Bounce Rate",
        value: "42.3%",
        change: "-5.4%",
        trend: "down",
        icon: Activity,
    },
];

const DashboardPage = () => {
    const { props } = usePage<PageProps>();
    const { analyticsConfigured, analyticsData, websiteData } = props;

    // Use real data if configured, otherwise mock
    const stats = analyticsConfigured ? [
        {
            title: "Total Page Views",
            value: analyticsData.pageViews.toLocaleString(),
            change: "+0%", // Needs comparison data
            trend: "neutral",
            icon: Eye,
        },
        {
            title: "Unique Visitors",
            value: analyticsData.totalVisitors.toLocaleString(),
            change: "+0%",
            trend: "neutral",
            icon: Users,
        },
        {
            title: "Avg. Session Duration",
            value: `${Math.floor(analyticsData.avgSessionDuration / 60)}m ${Math.round(analyticsData.avgSessionDuration % 60)}s`,
            change: "+0%",
            trend: "neutral",
            icon: Clock,
        },
        {
            title: "Bounce Rate",
            value: `${analyticsData.bounceRate.toFixed(1)}%`,
            change: "+0%",
            trend: "neutral",
            icon: Activity,
        },
    ] : mockStats;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-1">Welcome back to your comprehensive analytics overview.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-md hidden md:block">
                        Last updated: Just now
                    </div>
                    <Button variant="outline" size="sm">
                        Export
                    </Button>
                    <Button size="sm" variant={analyticsConfigured ? "outline" : "default"}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        {analyticsConfigured ? "Analytics Connected" : "Connect Analytics"}
                    </Button>
                </div>
            </div>

            {!analyticsConfigured && (
                <Alert className="bg-blue-50/50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle className="ml-2">Analytics Setup Required</AlertTitle>
                    <AlertDescription className="ml-2 mt-1">
                        Your dashboard is currently showing demonstration data. To see real-time insights from your website, please connect your Google Analytics 4 property in <Link href="/admin/settings" className="underline font-medium hover:text-blue-900 dark:hover:text-blue-200">Settings</Link>.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className="p-2 bg-primary/10 rounded-full">
                                <stat.icon className="h-4 w-4 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className={`text-xs mt-1 flex items-center font-medium ${stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : (stat.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-500')}`}>
                                {stat.trend !== 'neutral' && (
                                    stat.trend === 'up' ? (
                                        <ArrowUpRight className="h-3 w-3 mr-1" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 mr-1" />
                                    )
                                )}
                                {stat.change} <span className="text-muted-foreground font-normal ml-1">from last month</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight">Website Content</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{websiteData.totalProducts.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Manage items in your store</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-all border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
                            <FolderTree className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{websiteData.totalCategories.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Organize your content structure</p>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-all border-l-4 border-l-orange-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Blog Posts</CardTitle>
                            <FileText className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{websiteData.totalPosts.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground mt-1">Articles and news updates</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>Traffic Overview</CardTitle>
                        <CardDescription>
                            Daily unique visitors over the last 30 days.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[400px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg mx-2">
                            <BarChart3 className="h-10 w-10 text-slate-300 mb-2" />
                            <span className="text-sm text-muted-foreground font-medium">Chart Visualization Placeholder</span>
                            <span className="text-xs text-muted-foreground mt-1">Install a chart library (e.g. Recharts) to enable</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

DashboardPage.layout = (page: ReactNode) => <AppLayout>{page}</AppLayout>;

export default DashboardPage;
