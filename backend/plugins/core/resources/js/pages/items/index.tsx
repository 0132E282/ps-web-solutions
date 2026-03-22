import { DataTable } from "@core/components/table";
import { Card } from "@core/components/ui/card";
import { useModule } from "@core/hooks/use-module";
import AppLayout from "@core/layouts/app-layout";
import { getCurrentRouteName } from "@core/lib/route";
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

    const resource = useSelector((state: RootState) =>
        resourceName ? state.resource[resourceName] : undefined
    );

    const { views } = useModule();

    useEffect(() => {
        if (resourceName && !resource) {
            dispatch(fetchResourceRequest({ resource: resourceName }));
        }
    }, [dispatch, resourceName, resource]);

    if (!resourceName) {
        return null;
    }

    const layouts = Array.isArray(views?.layouts) ? views.layouts : ['table'];
    const actions = views?.actions || {};

    return (
        <AppLayout toolbar={{ ui: 'table', layouts, actions, locale: true }}>
            <Card className="p-4">
                <DataTable resource={resource as unknown as Resource<Item>} />
            </Card>
        </AppLayout>
    );
};

export default Index;
