import AppLayout from "@core/layouts/app-layout";
import { ReactNode } from 'react';
import { Card, CardContent } from "@core/components/ui/card";
import { usePage } from "@inertiajs/react";

interface PageProps {
    analyticsConfigured: boolean;
    [key: string]: unknown;
}

const AnalyticsPage = () => {
    const { props } = usePage<PageProps>();
    const { analyticsConfigured } = props;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Google Analytics</h2>
                <p className="text-muted-foreground mt-1">Detailed visitor statistics and user behavior reports.</p>
            </div>

            {analyticsConfigured ? (
                <Card className="col-span-full border-none shadow-md overflow-hidden">
                    <CardContent className="p-0">
                        <div className="h-[1200px] w-full bg-slate-50 dark:bg-slate-900/50">
                            <iframe
                                width="100%"
                                height="100%"
                                title="Google Analytics Report"
                                src="https://lookerstudio.google.com/embed/reporting/3d500e67-4a18-4982-b5df-82a6ff367026/page/1M"
                                frameBorder="0"
                                allowFullScreen
                                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                            />
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
                    <h3 className="text-lg font-semibold">Analytics Not Configured</h3>
                    <p className="text-muted-foreground mt-2 mb-6 max-w-md">
                        Connect Google Analytics to view detailed reports here.
                    </p>
                    {/* Add connect button here once settings page exists */}
                </div>
            )}
        </div>
    );
};

AnalyticsPage.layout = (page: ReactNode) => <AppLayout>{page}</AppLayout>;

export default AnalyticsPage;
