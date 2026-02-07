import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormPages } from '@core/components/form/form-pages';
import { Section } from '@core/components/section';
import AppLayout from '@core/layouts/app-layout';
import { getCurrentRouteName } from '@core/lib/route';
import { createResourceRequest, updateResourceRequest, fetchItemRequest } from '@core/redux';
import type { RootState } from '@core/redux/store';

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
            // Extract all field names from both main and sidebar sections
            const fieldNames = [
                ...mainSections.flatMap(s => s.fields || []),
                ...sidebarSections.flatMap(s => s.fields || [])
            ].map(f => typeof f === 'string' ? f : (f as Record<string, unknown>)?.name).filter(Boolean);

            dispatch(fetchItemRequest({
                resource: resourceName,
                id: itemId,
                params: { fields: fieldNames.join(',') }
            }));
        }
    }, [dispatch, isEdit, itemId, resourceName, mainSections, sidebarSections]);

    const handleSave = (data: Record<string, unknown>) => {
        if (isEdit && itemId) {
            dispatch(updateResourceRequest({ resource: resourceName, id: itemId, data }));
        } else {
            dispatch(createResourceRequest({ resource: resourceName, data }));
        }
    };

    // Merge inertia item with redux item if redux item is loaded
    // Only use persistent item data if we are in edit mode to avoid state leakage in create mode
    const currentItem = isEdit ? ((resourceState?.item as Record<string, unknown>) || inertiaItem || {}) : {};

    return (
        <AppLayout>
            <FormPages
                defaultValues={currentItem}
                onSubmit={handleSave}
            >
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-6">
                        {mainSections.map((section, index) => <Section key={index} section={section} variant="main" />)}
                    </div>
                    {sidebarSections.length > 0 && (
                        <div className="w-full lg:w-[400px] space-y-6">
                            {sidebarSections.map((section, index) => <Section key={index} section={section} variant="sidebar" />)}
                        </div>
                    )}
                </div>
            </FormPages>
        </AppLayout>
    );
};

export default FormPage;
