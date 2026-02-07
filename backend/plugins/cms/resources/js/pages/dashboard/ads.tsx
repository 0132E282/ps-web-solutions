import AppLayout from "@core/layouts/app-layout";
import { ReactNode } from 'react';
import { Button } from "@core/components/ui/button";
import { TrendingUp } from "lucide-react";
// eslint-disable-next-line import/order
import { usePage } from "@inertiajs/react";

interface PageProps {
    adsConfigured: boolean;
    [key: string]: unknown;
}

const AdsPage = () => {
    const { props } = usePage<PageProps>();
    const { adsConfigured } = props;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Google Ads</h2>
                <p className="text-muted-foreground mt-1">Monitor ad performance, conversions, and ROI.</p>
            </div>

            {adsConfigured ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/10 rounded-lg">
                    <p>Ad metrics would appear here.</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                        <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold">Google Ads Not Connected</h3>
                    <p className="text-muted-foreground mt-2 mb-6 max-w-md">
                        Link your Google Ads account to track campaign performance directly from your dashboard.
                    </p>
                    <Button onClick={() => window.location.href = '/admin/settings/ads'}>
                        Connect Google Ads
                    </Button>
                </div>
            )}
        </div>
    );
};

AdsPage.layout = (page: ReactNode) => <AppLayout>{page}</AppLayout>;

export default AdsPage;
