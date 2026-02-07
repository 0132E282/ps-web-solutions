import { Card } from "@core/components/ui/card";
import AppLayout from "@core/layouts/app-layout";
import HeaderToolbarTable from "@core/components/toolbar/toolbar-table-page";
import { DataTable } from "@core/components/table";
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useModule } from "@core/hooks/use-module";
import { fetchResourceRequest } from "@core/redux";
import { RootState } from "@core/redux/store";
import { PaginationInfo } from "@core/components/table/helpers";
import { getCurrentRouteName, route } from "@core/lib/route";

interface Item {
    id: number;
    [key: string]: unknown;
}

const Index = () => {
    const dispatch = useDispatch();
    // Dynamically get resource name from current route, default to 'admin.products.index' if null
    // Example: 'admin.posts.index' -> 'admin.posts.index'
    const resourceName = getCurrentRouteName() || '';

    // Don't modify conditional render logic that prevents hooks from running
    // We should always call hooks at the top level
    const resourceState = useSelector((state: RootState) => resourceName ? state.resource[resourceName] : undefined);

    useEffect(() => {
        if (resourceName) {
            dispatch(fetchResourceRequest({ resource: resourceName }));
        }
    }, [dispatch, resourceName]);

    const { views, crudRoutes } = useModule();

    // Transform pagination if exists
    // Transform pagination if exists
    const pagination: PaginationInfo | null = useMemo(() => {
        if (!resourceState?.pagination) return null;
        return {
            current_page: resourceState.pagination.meta?.current_page || 1,
            last_page: resourceState.pagination.meta?.last_page || 1,
            per_page: resourceState.pagination.meta?.per_page || 10,
            total: resourceState.pagination.meta?.total || 0,
            from: resourceState.pagination.meta?.from || 0,
            to: resourceState.pagination.meta?.to || 0
        };
    }, [resourceState?.pagination]);

    if (!resourceName) {
        return null;
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-4">
                <HeaderToolbarTable
                    create={views?.actions?.create}
                    import={views?.actions?.import}
                    export={views?.actions?.export}
                    importRoute={crudRoutes.import || undefined}
                    exportRoute={crudRoutes.export || undefined}
                    importTemplateRoute={crudRoutes.importTemplate || undefined}
                    duplicate={views?.actions?.duplicate}
                    duplicateRoute={crudRoutes.duplicate || undefined}
                    tabnavs={
                        crudRoutes.trash && route.has(crudRoutes.trash) ? [
                            {
                                label: 'Danh sách',
                                route: crudRoutes.index || undefined,
                                active: !getCurrentRouteName()?.endsWith('.trash')
                            },
                            {
                                label: 'Thùng rác',
                                route: crudRoutes.trash,
                                active: getCurrentRouteName()?.endsWith('.trash')
                            }
                        ] : undefined
                    }
                />
            </div>
            <Card className="p-4">
                <DataTable
                    items={resourceState?.items as Item[]}
                    pagination={pagination}
                    // Pass explicit loading state if DataTable supports it, otherwise it depends on props
                />
            </Card>
        </AppLayout>
    );
}

export default Index;
