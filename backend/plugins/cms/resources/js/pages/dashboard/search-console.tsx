import AppLayout from "@core/layouts/app-layout";
import { ReactNode } from 'react';
import { Button } from "@core/components/ui/button";
import { Search } from "lucide-react";
import { usePage } from "@inertiajs/react";

interface PageProps {
    searchConsoleConfigured: boolean;
    [key: string]: unknown;
}

const SearchConsolePage = () => {
    const { props } = usePage<PageProps>();
    const { searchConsoleConfigured } = props;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Google Search Console</h2>
                <p className="text-muted-foreground mt-1">Analyze organic search traffic and performance.</p>
            </div>

            {searchConsoleConfigured ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/10 rounded-lg">
                    <p>Search performance data would appear here.</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
                    <div className="p-4 bg-indigo-100 dark:bg-indigo-900/20 rounded-full mb-4">
                        <Search className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold">Search Console Not Connected</h3>
                    <p className="text-muted-foreground mt-2 mb-6 max-w-md">
                        Connect Google Search Console to monitor your site's presence in Google Search results.
                    </p>
                    <Button onClick={() => window.location.href = '/admin/settings/search-console'}>
                        Connect Search Console
                    </Button>
                </div>
            )}
        </div>
    );
};

SearchConsolePage.layout = (page: ReactNode) => <AppLayout>{page}</AppLayout>;

export default SearchConsolePage;
