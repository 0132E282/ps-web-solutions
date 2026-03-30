// # GOOD: SOLID, DRY, KISS
import { route, getCurrentRouteName } from "@core/lib/route";
import type { ApiResponse, PaginationInfo } from "@core/types/api";
import type { DataTableFilter } from "@core/types/filter";
import type { BaseResourceItem } from "@core/types/resource";
import { fieldsToColumns, baseColumns as defaultBaseColumns } from "@core/utils/table-columns";
import { router, usePage } from "@inertiajs/react";
import type { ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { axios } from "@core/lib/axios";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { formatFiltersForAPI, getResourceNameFromRoute, mergeColumns, createFilterFn, extractFromPaginator, getUrlParams, encodeFilters, formatSortingForAPI } from "../components/table/helpers";
import { tableRegistry } from "../components/table/table-registry";
import { fetchResourceSuccess } from "../redux/slices/resourceSlice";
import type { DataTableProps, TreeItem } from "@core/types/table";
import type { InertiaPageProps } from "@core/types/inertia";

export type { InertiaPageProps, DataTableProps, TreeItem };

// --- UTILITIES ---
const flattenTree = <T extends Record<string, unknown>>(
    tree: T[], level = 0, parentId: string | number | null = null, expandedRows?: Set<string | number>
): TreeItem<T>[] =>
    tree.flatMap(node => {
        const { children, ...rest } = node;
        const nodeId = (node.id || rest.id) as string | number;
        const hasChildren = Array.isArray(children) && children.length > 0;
        const current = { ...rest, _level: level, _hasChildren: hasChildren, _parentId: parentId, _id: nodeId } as TreeItem<T>;
        return (hasChildren && expandedRows?.has(String(nodeId))) 
            ? [current, ...flattenTree(children as T[], level + 1, nodeId, expandedRows)] : [current];
    });

export const getColumnKey = (column: any): string | undefined => column.id || column.accessorKey;

const normalizePagination = (raw: any): PaginationInfo | null => {
    if (!raw) return null;
    const r = raw.meta || raw;
    return {
        current_page: r.current_page ?? 1, last_page: r.last_page ?? 1, per_page: r.per_page ?? 10,
        total: r.total ?? 0, from: r.from ?? 0, to: r.to ?? 0,
    };
};

const checkTreeMode = (obj: any): boolean => /tree/i.test(obj?.['load-items'] || obj?.loaditems || obj?.config?.['load-items'] || '');

// --- HOOKS ---
export function useDataTableRoute(routeProp?: string) {
    const { props, url } = usePage<InertiaPageProps>();
    const currentRouteName = useMemo(() => props?.ziggy?.route?.name || getCurrentRouteName() || null, [props?.ziggy]);
    const resourceName = useMemo(() => getResourceNameFromRoute(currentRouteName), [currentRouteName]);
    const routeName = routeProp || currentRouteName || null;
    const effectiveApiUrl = useMemo(() => {
        try { return routeName ? route(routeName) : null; } catch { return null; }
    }, [routeName]);
    return { currentRouteName, resourceName, routeName, effectiveApiUrl, effectiveUseApi: !!(routeName && effectiveApiUrl), props, url };
}

function useColumnOrderStorage(resourceName: string | null) {
    const [columnOrder, setColumnOrder] = useState<string[]>([]);
    useEffect(() => {
        if (!resourceName) return;
        const saved = localStorage.getItem(`column_order_${resourceName}`);
        if (saved) try { setColumnOrder(JSON.parse(saved)); } catch {}
    }, [resourceName]);

    const saveOrder = useCallback((updater: any) => {
        setColumnOrder(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (resourceName) localStorage.setItem(`column_order_${resourceName}`, JSON.stringify(next));
            return next;
        });
    }, [resourceName]);
    return [columnOrder, saveOrder] as const;
}

export function useDataTableData<TData extends BaseResourceItem, TValue = unknown>(
    { effectiveUseApi, effectiveApiUrl, resourceName, routeName, props }: any,
    { itemsProp, dataProp, paginationProp, resourceProp }: any,
    { isTreeMode, expandedRows, columnFiltersRef, locale }: any
) {
    const dispatch = useDispatch();
    const [tableData, setTableData] = useState<any>(itemsProp || dataProp || props.items || props.data || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiColumns, setApiColumns] = useState<any[]>([]);
    const [apiFilters, setApiFilters] = useState<DataTableFilter[]>([]);
    const lastFetchedUrlRef = useRef<string | null>(null);
    const isFetchingRef = useRef(false);

    const reduxResource = useSelector((state: any) => routeName ? state.resource[routeName] : null);

    useEffect(() => { setTableData(itemsProp || dataProp || props.items || props.data); }, [itemsProp, dataProp, props.items, props.data]);
    
    useEffect(() => {
        const resource = resourceProp || reduxResource;
        if (resource?.items) setTableData(resource);
        setIsLoading(!!resource?.loading);
        if (resource?.error !== undefined) setError(resource.error);
    }, [resourceProp, reduxResource]);

    const fetchData = useCallback(async (pageIndex: number, pageSize: number, search?: string, af: any[] = [], sorting: any[] = []) => {
        if (!effectiveUseApi || isFetchingRef.current) return;
        isFetchingRef.current = true; setIsLoading(true); setError(null);
        try {
            const params = new URLSearchParams({ page: String(pageIndex), limit: String(pageSize), _t: String(Date.now()) });
            if (locale) params.set('locale', locale);
            if (search) params.set('search', search);
            if (isTreeMode) params.set('tree', 'true');
            formatFiltersForAPI(columnFiltersRef.current, []).forEach((v, k) => params.append(k, v));
            sorting.length && formatSortingForAPI(sorting).forEach((v, k) => params.set(k, v));
            
            if (effectiveApiUrl) {
                const { data } = await axios.get<ApiResponse<TData>>(effectiveApiUrl, { params });
                setTableData(data);
                if (data.fields?.length) setApiColumns(fieldsToColumns(data.fields as any, resourceName));
                if (data.filters?.length) setApiFilters(data.filters);
                if (routeName) dispatch(fetchResourceSuccess({ resource: routeName, data: (data.items || data.data || []) as any, pagination: (data.meta || data.links) ? (data as any) : undefined }));
            }
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); isFetchingRef.current = false; }
    }, [effectiveUseApi, effectiveApiUrl, isTreeMode, columnFiltersRef, dispatch, routeName, locale, resourceName]);

    const updateUrlParams = useCallback((p: number, l: number, s?: string, af: any[] = [], cf: any[] = [], sort: any[] = []) => {
        const url = new URL(window.location.href);
        url.searchParams.set('page', String(p)); url.searchParams.set('limit', String(l));
        s ? url.searchParams.set('search', s) : url.searchParams.delete('search');
        url.searchParams.delete('sorts[0][column]'); url.searchParams.delete('order[0][order]');
        formatSortingForAPI(sort).forEach((v, k) => url.searchParams.set(k, v));
        (cf.length || af.length) ? url.searchParams.set('f', encodeFilters({ cf, af })) : url.searchParams.delete('f');

        if (effectiveUseApi && effectiveApiUrl) {
            window.history.replaceState({}, '', url.toString());
            fetchData(p, l, s, af, sort);
        } else router.get(url.pathname + url.search, {}, { preserveState: true, replace: true });
    }, [effectiveUseApi, effectiveApiUrl, fetchData]);

    const { items, pagination } = useMemo(() => {
        const extracted = extractFromPaginator<TData>(tableData || reduxResource || { items: [] });
        let processed = extracted.items;
        if (isTreeMode && processed.length && processed.some((i: any) => i.children)) 
            processed = flattenTree(processed as any, 0, null, expandedRows) as TData[];
        return { items: processed, pagination: normalizePagination(extracted.pagination || reduxResource?.pagination || paginationProp || props.pagination) };
    }, [tableData, reduxResource, paginationProp, isTreeMode, expandedRows, props.pagination]);

    return { items, pagination, apiColumns, apiFilters, isLoading, error, isFetchingRef, setApiItemsRaw: setTableData, setApiColumns, setApiFilters, fetchData, updateUrlParams, lastFetchedUrlRef };
}

export function useDataTableColumns<TData extends BaseResourceItem, TValue>(
    { props, effectiveUseApi, resourceName, routeName }: any,
    { columnsProp, baseColumns }: any,
    apiColumns: any[],
    filters: DataTableFilter[] = []
) {
    const rawColumns = useMemo(() => {
        if (columnsProp) return columnsProp;
        const configFields = props.views?.fields || props.configs?.fields;
        if (Array.isArray(configFields) && configFields.length) return fieldsToColumns(configFields as any, resourceName);
        return (effectiveUseApi && apiColumns.length) ? apiColumns : (props.columns || []);
    }, [columnsProp, props, resourceName, effectiveUseApi, apiColumns]);

    const mergedColumns = useMemo(() => mergeColumns(rawColumns, baseColumns || defaultBaseColumns, resourceName, routeName), [rawColumns, baseColumns, resourceName, routeName]);
    
    const columns = useMemo(() => {
        const all = !filters.length ? mergedColumns : [...mergedColumns, ...filters.filter(f => f.key && !mergedColumns.some(m => getColumnKey(m) === f.key)).map(f => ({ id: f.key, accessorKey: f.key, header: f.label || f.key, hidden: true }))];
        return all.map(col => {
            const f = filters.find(filter => filter.key === getColumnKey(col) || filter.key === col.id);
            return f ? { ...col, filterFn: createFilterFn(f) } : col;
        });
    }, [filters, mergedColumns]);

    return { columns, mergedColumns, searchableFields: mergedColumns.map(getColumnKey).filter(k => k && !['select', 'actions'].includes(k)) };
}

export function useDataTable<TData extends BaseResourceItem, TValue = unknown>(props: DataTableProps<TData, TValue>) {
    const { i18n } = useTranslation();
    const [tableId] = useState(() => `t-${Math.random().toString(36).slice(2, 11)}`);
    const routeInfo = useDataTableRoute(props.route);
    const { effectiveUseApi, effectiveApiUrl, resourceName } = routeInfo;
    const initialParams = useMemo(() => getUrlParams(), []);

    const [advancedFilters, setAdvancedFilters] = useState(initialParams.advancedFilters || []);
    const [expandedRows, setExpandedRows] = useState(new Set<string | number>());
    const [sorting, setSorting] = useState<SortingState>(initialParams.sorting || []);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialParams.filters || []);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [pageSize, setPageSize] = useState(initialParams.limit || 10);
    const [pageIndex, setPageIndex] = useState(initialParams.page - 1);
    const [globalFilterState, setGlobalFilterState] = useState(initialParams.search);
    
    const columnFiltersRef = useRef(columnFilters);
    const [columnOrder, handleColumnOrderChange] = useColumnOrderStorage(resourceName);
    const isTreeMode = useMemo(() => props.viewMode === 'tree' || checkTreeMode(routeInfo.props.configs || routeInfo.props.views), [routeInfo.props, props.viewMode]);

    const data = useDataTableData<TData, TValue>(routeInfo, props, { isTreeMode, expandedRows, columnFiltersRef, locale: i18n.language });
    const { fetchData, updateUrlParams, items, pagination } = data;
    const { columns, mergedColumns } = useDataTableColumns(routeInfo, props, data.apiColumns, data.apiFilters);

    useEffect(() => { columnFiltersRef.current = columnFilters; }, [columnFilters]);
    useEffect(() => { if (pagination) { setPageSize(pagination.per_page || 10); setPageIndex((pagination.current_page || 1) - 1); } }, [pagination]);

    useEffect(() => {
        const fullUrl = effectiveApiUrl ? (effectiveApiUrl + window.location.search) : null;
        if (!effectiveUseApi || !effectiveApiUrl || data.lastFetchedUrlRef.current === fullUrl) return;
        data.lastFetchedUrlRef.current = fullUrl;
        const p = getUrlParams();
        setGlobalFilterState(p.search); setPageSize(p.limit); setPageIndex(p.page - 1);
        setColumnFilters(p.filters || []); setAdvancedFilters(p.advancedFilters || []); setSorting(p.sorting || []);
        fetchData(p.page, p.limit, p.search, p.advancedFilters, p.sorting);
    }, [effectiveUseApi, effectiveApiUrl, fetchData, routeInfo.url]);

    const table = useReactTable({
        data: items, columns, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true, pageCount: pagination?.last_page || 1, autoResetPageIndex: false,
        enableRowSelection: true, state: { sorting, columnFilters, columnVisibility, rowSelection, pagination: { pageIndex, pageSize }, columnOrder },
        onSortingChange: (u) => setSorting(p => { const next = typeof u === 'function' ? u(p) : u; updateUrlParams(1, pageSize, globalFilterState, advancedFilters, columnFilters, next); return next; }),
        onColumnFiltersChange: (u) => setColumnFilters(p => { const next = typeof u === 'function' ? u(p) : u; updateUrlParams(1, pageSize, globalFilterState, advancedFilters, next, sorting); return next; }),
        onColumnVisibilityChange: setColumnVisibility, onRowSelectionChange: setRowSelection, onColumnOrderChange: handleColumnOrderChange,
        onPaginationChange: (u: any) => { const next = typeof u === 'function' ? u({ pageIndex, pageSize }) : u; setPageSize(next.pageSize); setPageIndex(next.pageIndex); },
    });

    const updateSearch = useCallback((val: string) => {
        setGlobalFilterState(val);
        if (pagination || effectiveUseApi) { setPageIndex(0); updateUrlParams(1, pageSize, val, advancedFilters, columnFilters, sorting); }
    }, [pagination, effectiveUseApi, pageSize, updateUrlParams, advancedFilters, columnFilters, sorting]);

    const handleAdvancedFilterApply = useCallback(() => {
        setPageIndex(0);
        updateUrlParams(1, pageSize, globalFilterState, advancedFilters, columnFilters, sorting);
    }, [pageSize, globalFilterState, advancedFilters, columnFilters, sorting, updateUrlParams]);

    const handleAdvancedFilterClear = useCallback(() => {
        setAdvancedFilters([]);
        setPageIndex(0);
        updateUrlParams(1, pageSize, globalFilterState, [], columnFilters, sorting);
    }, [pageSize, globalFilterState, columnFilters, sorting, updateUrlParams]);

    useEffect(() => {
        tableRegistry.register(tableId, table, routeInfo.currentRouteName || undefined, { refreshData: fetchData, effectiveUseApi });
        return () => tableRegistry.unregister(tableId);
    }, [table, tableId, routeInfo.currentRouteName, fetchData, effectiveUseApi]);

    return {
        table, ...data, mergedColumns, searchValue: globalFilterState, updateSearch, handleSearchClear: () => updateSearch(""),
        advancedFilters, setAdvancedFilters, handleAdvancedFilterApply, handleAdvancedFilterClear, effectiveUseApi,
        isTreeMode, expandedRows, toggleRowExpansion: (id: any) => setExpandedRows(prev => { const next = new Set(prev); const s = String(id); next.has(s) ? next.delete(s) : next.add(s); return next; }),
        pageSize, pageIndex, handlePageSizeChange: (s: number) => { setPageSize(s); setPageIndex(0); updateUrlParams(1, s, globalFilterState, advancedFilters, columnFilters, sorting); },
        handlePageIndexChange: (i: number) => { setPageIndex(i); updateUrlParams(i + 1, pageSize, globalFilterState, advancedFilters, columnFilters, sorting); },
        paginationInfo: useMemo(() => ({ currentPage: pageIndex + 1, totalPages: pagination?.last_page ?? (Math.ceil(items.length / pageSize) || 1), totalRows: pagination?.total ?? items.length, pageSize, startRow: (pagination?.from ?? (pageIndex * pageSize + 1)), endRow: (pagination?.to ?? Math.min((pageIndex + 1) * pageSize, items.length)) }), [pagination, pageIndex, pageSize, items.length]),
        toolbarRow: props.toolbarRow, rowSelection, columnOrder, reorderable: props.reorderable, onReorder: props.onReorder, resourceName,
    };
}
