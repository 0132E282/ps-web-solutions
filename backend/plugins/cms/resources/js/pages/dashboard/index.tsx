import AppLayout from "@core/layouts/app-layout";
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@core/components/ui/card";
import { Button } from "@core/components/ui/button";
import { Activity, Users, Eye, ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3, Search } from "lucide-react";
import { usePage, Link } from "@inertiajs/react";
import { route } from "ziggy-js";

interface AnalyticsData {
    totalVisitors: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
}

interface EcommerceData {
    totalSales: number;
    totalOrders: number;
    recentOrders: Array<{
        id: number;
        order_number: string;
        customer_name: string;
        email: string;
        total: number;
        status: string;
        created_at: string;
    }>;
    salesChart: Array<{
        date: string;
        formatted_date: string;
        sales: number;
        orders: number;
    }>;
}

interface PageProps {
    analyticsConfigured: boolean;
    adsConfigured: boolean;
    searchConsoleConfigured: boolean;
    analyticsData: AnalyticsData;
    ecommerceData: EcommerceData;
    [key: string]: unknown;
}

const ServiceConnectionCard = ({
    title,
    description,
    icon: Icon,
    isConnected,
    href,
    colorClass
}: {
    title: string;
    description: string;
    icon: any;
    isConnected: boolean;
    href: string;
    colorClass: string;
}) => (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-l-4" style={{ borderLeftColor: isConnected ? '#22c55e' : 'transparent' }}>
        <CardHeader>
            <div className={`p-3 rounded-xl w-fit mb-4 ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
                <Icon className={`h-8 w-8 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="text-sm mt-2 min-h-[40px]">
                {description}
            </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto pt-0">
            <div className="flex items-center justify-between mt-4">
                <span className={`text-sm font-medium flex items-center gap-2 ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {isConnected ? 'Active & Syncing' : 'Not Connected'}
                </span>
                <Link href={href}>
                    <Button
                        variant={isConnected ? "outline" : "default"}
                        size="sm"
                        className={!isConnected ? "bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200" : ""}
                    >
                        {isConnected ? 'View Report' : 'Connect'}
                    </Button>
                </Link>
            </div>
        </CardContent>
    </Card>
);

const DashboardPage = () => {
    const { props } = usePage<PageProps>();
    const { analyticsConfigured, adsConfigured, searchConsoleConfigured, analyticsData, ecommerceData } = props;

    // Derived stats for the summary view if Analytics is connected
    const stats = analyticsConfigured ? [
        {
            title: "Total Page Views",
            value: analyticsData.pageViews.toLocaleString(),
            change: "+0%",
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
            title: "Total Sales",
            value: `$${ecommerceData.totalSales.toLocaleString()}`,
            change: "+0%",
            trend: "neutral",
            icon: TrendingUp,
        },
        {
            title: "Total Orders",
            value: ecommerceData.totalOrders.toLocaleString(),
            change: "+0%",
            trend: "neutral",
            icon: Activity,
        },
    ] : [];

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-muted-foreground mt-1">
                        Connect and manage your Google services to get a complete picture of your performance.
                    </p>
                </div>
            </div>

            {/* Service Connection Hub */}
            <div className="grid gap-6 md:grid-cols-3">
                <ServiceConnectionCard
                    title="Google Analytics 4"
                    description="Track website traffic, user behavior, and engagement metrics."
                    icon={BarChart3}
                    colorClass="bg-orange-500 text-orange-500"
                    isConnected={analyticsConfigured}
                    href={route('admin.site.analytics')}
                />
                <ServiceConnectionCard
                    title="Google Ads"
                    description="Monitor ad campaigns, conversion rates, and ROI."
                    icon={TrendingUp}
                    colorClass="bg-blue-500 text-blue-500"
                    isConnected={adsConfigured}
                    href={route('admin.site.ads')}
                />
                <ServiceConnectionCard
                    title="Google Search Console"
                    description="Analyze search performance and fix indexing issues."
                    icon={Search}
                    colorClass="bg-indigo-500 text-indigo-500"
                    isConnected={searchConsoleConfigured}
                    href={route('admin.site.search-console')}
                />
            </div>

            {/* Configured Stats Summary (Only if Analytics Connected) */}
            {analyticsConfigured && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
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
            )}
        </div>
    );
};

DashboardPage.layout = (page: ReactNode) => <AppLayout>{page}</AppLayout>;

export default DashboardPage;
