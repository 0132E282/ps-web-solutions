import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePage } from "@inertiajs/react";
import { TreeSidebar } from "@core/components/ui/tree-sidebar";
import { FormPages } from "@core/components/form/form-pages";
import { Section } from "@core/components/section";
import { useModule } from "@core/hooks/use-module";
import AppLayout from "@core/layouts/app-layout";
import { route } from "@core/lib/route";
import {
    fetchResourceRequest,
    fetchItemRequest,
    createResourceRequest,
    updateResourceRequest,
} from "@core/redux";
import type { RootState } from "@core/redux/store";

const TreePage = () => {
    const { props } = usePage<{ form_views?: any }>();

    const dispatch = useDispatch();
    const { current: resourceName, views, actionRoutes } = useModule();

    const [selectedId, setSelectedId] = useState<number | string | null>(null);
    const [newChildParentId, setNewChildParentId] = useState<number | string | null>(null);

    const resource  = useSelector((state: RootState) => resourceName ? state.resource[resourceName] : undefined);
    const reduxItem = useSelector((state: RootState) => (resourceName && selectedId) ? state.resource[resourceName]?.item : null);

    const formViews = props.form_views || views.form || {};
    const { main: mainSections = [], sidebar: sidebarSections = [] } = formViews.sections || {};

    const isEdit = !!selectedId;

    useEffect(() => {
        if (resourceName) {
            dispatch(fetchResourceRequest({ resource: resourceName, params: { tree: true } }));
        }
    }, [dispatch, resourceName]);

    useEffect(() => {
        if (!isEdit || !selectedId || !resourceName) return;

        const fieldNames = [
            ...mainSections.flatMap((s: any) => s.fields || []),
            ...sidebarSections.flatMap((s: any) => s.fields || []),
        ].map((f: any) => (typeof f === 'string' ? f : (f as Record<string, unknown>)?.name)).filter(Boolean);

        dispatch(fetchItemRequest({ resource: resourceName, id: selectedId, params: { fields: fieldNames.join(',') } }));
    }, [dispatch, isEdit, selectedId, resourceName, mainSections, sidebarSections]);

    if (!resourceName) return null;

    const items = (resource?.items || []) as any[];

    return (
        <div className="flex flex-col lg:flex-row gap-4 items-start">
            <div className="w-full lg:w-96 xl:w-[420px] shrink-0 sticky top-4">
                <TreeSidebar
                    items={items}
                    selectedId={selectedId}
                    onSelect={(item) => setSelectedId(item?.id ?? null)}
                    onCreateClick={() => setSelectedId(null)}
                    onAddChild={(parentId) => { setNewChildParentId(parentId); setSelectedId(null); }}
                    onMove={(id, parentId) => {
                        if (resourceName)
                            dispatch(updateResourceRequest({ resource: resourceName, id, data: { parent_id: parentId } }));
                    }}
                />
            </div>

            {/* ── RIGHT: Form ──────────────────────────────── */}
            <div className="flex-1 min-w-0">
                <FormPages
                    key={selectedId ?? `new-${newChildParentId ?? ''}`}
                    defaultValues={(reduxItem as any) || (newChildParentId && !selectedId ? { parent_id: newChildParentId } : {})}
                    onSubmit={(data) => {
                        if (isEdit && selectedId) {
                            dispatch(updateResourceRequest({ resource: resourceName, id: selectedId, data }));
                        } else {
                            dispatch(createResourceRequest({ resource: resourceName, data }));
                        }
                    }}
                    layouts={Array.isArray(views?.layouts) ? views.layouts : ['table', 'tree']}
                    viewMode="tree"
                    onViewModeChange={(val) => {
                        if (val === 'table' && actionRoutes.index)
                            window.location.href = route(actionRoutes.index);
                    }}
                >
                    <div className="grid grid-cols-1 gap-6">
                        {mainSections.map((section: any, index: number) => (
                            <Section key={`main-${index}`} section={section} variant="main" />
                        ))}
                        {sidebarSections.map((section: any, index: number) => (
                            <Section key={`sidebar-${index}`} section={section} variant="sidebar" />
                        ))}
                    </div>
                </FormPages>
            </div>

        </div>
    );
};

TreePage.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;

export default TreePage;
