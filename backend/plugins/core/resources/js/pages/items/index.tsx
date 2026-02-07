import { DataTable } from "@core/components/table";
import HeaderToolbarTable from "@core/components/toolbar/toolbar-table-page";
import { Card } from "@core/components/ui/card";
import { useModule } from "@core/hooks/use-module";
import AppLayout from "@core/layouts/app-layout";
import { getCurrentRouteName, route } from "@core/lib/route";
import { fetchResourceRequest } from "@core/redux";
import type { RootState } from "@core/redux/store";
import type { Resource } from "@core/types/resource";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

interface Item extends Record<string, unknown> {
    id: number;
}


const Index = () => {
    const dispatch = useDispatch();
    const resourceName = getCurrentRouteName() || '';

    const resource = useSelector((state: RootState) => resourceName ? state.resource[resourceName] : undefined);

    useEffect(() => {
        if (resourceName) {
            dispatch(fetchResourceRequest({ resource: resourceName }));
        }
    }, [dispatch, resourceName]);

    const { views, crudRoutes } = useModule();

    if (!resourceName) {
        return null;
    }
    return (
        <>
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

            <Card className="p-4">
                <DataTable resource={resource as unknown as Resource<Item>}/>
            </Card>
        </>
    );
}

Index.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;


export default Index;
