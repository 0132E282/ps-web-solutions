import { usePage } from '@inertiajs/react';
import AppLayout from '@core/layouts/app-layout';
import { Section } from '@core/components/section';
import { FormPages } from '@core/components/form/form-pages';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createResourceRequest, updateResourceRequest, fetchItemRequest } from '@core/redux';
import { RootState } from '@core/redux/store';
import { getCurrentRouteName } from '@core/lib/route';

interface FormViews {
    title?: string;
    description?: string;
    icon?: string;
    sections?: {
        main?: Array<{ header?: { title?: string; description?: string }; fields?: Array<string | Record<string, unknown>> }>;
        sidebar?: Array<{ header?: { title?: string; description?: string }; fields?: Array<string | Record<string, unknown>> }>;
    };
}

interface ModelConfigs {
    [fieldName: string]: {
        type?: string;
        config?: Record<string, unknown>;
    };
}

const FormPage = () => {
    const { props } = usePage<{
        views?: FormViews;
        configs?: ModelConfigs;
        item?: Record<string, unknown> & { id?: number | string };
    }>();

    const { views = {}, item: inertiaItem } = props;
    const { main: mainSections = [], sidebar: sidebarSections = [] } = views.sections || {};



    const dispatch = useDispatch();
    // Normalize current route to index for resource key
    // e.g. 'admin.posts.create', 'admin.posts.edit' -> 'admin.posts.index'
    const currentRoute = getCurrentRouteName() || 'admin.products.index';
    const resourceName = currentRoute.replace(/\.(create|store|edit|update|show)$/, '.index');

    const resourceState = useSelector((state: RootState) => state.resource[resourceName]);

    const itemId = inertiaItem?.id;
    const isEdit = !!itemId;

    useEffect(() => {
        if (isEdit && itemId) {
            dispatch(fetchItemRequest({ resource: resourceName, id: itemId }));
        }
    }, [dispatch, isEdit, itemId, resourceName]);

    const handleSave = (data: Record<string, unknown>) => {
        if (isEdit && itemId) {
            dispatch(updateResourceRequest({ resource: resourceName, id: itemId, data }));
        } else {
            dispatch(createResourceRequest({ resource: resourceName, data }));
        }
    };

    // Merge inertia item with redux item if redux item is loaded
    const currentItem = (resourceState?.item as Record<string, unknown>) || inertiaItem || {};

    return (
        <AppLayout>
            <FormPages
                defaultValues={currentItem}
                onSubmit={handleSave}
            >
                <div className="flex gap-6">
                    <div className="flex-1 space-y-6">
                        {mainSections.map((section, index) => <Section key={index} section={section} variant="main" />)}
                    </div>
                    {sidebarSections.length > 0 && (
                        <div className="flex-1 max-w-[400px] space-y-6">
                            {sidebarSections.map((section, index) => <Section key={index} section={section} variant="sidebar" />)}
                        </div>
                    )}
                </div>
            </FormPages>
        </AppLayout>
    );
};

export default FormPage;
