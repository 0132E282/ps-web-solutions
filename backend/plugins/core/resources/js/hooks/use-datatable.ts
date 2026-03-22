// # GOOD: Tuân thủ SOLID, DRY, KISS
import { route, getCurrentRouteName } from "@core/lib/route";
import type { ApiResponse } from "@core/types/api";
import type { DataTableFilter } from "@core/types/filter";
import type { ResourcePagination, Resource } from "@core/types/resource";
import { fieldsToColumns, baseColumns as defaultBaseColumns } from "@core/utils/table-columns";
import { router, usePage } from "@inertiajs/react";
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { axios } from "@core/lib/axios";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import type { AdvancedFilterCondition } from "../components/advanced-filter";
import { formatFiltersForAPI, getResourceNameFromRoute, mergeColumns, createFilterFn, extractFromPaginator, getUrlParams } from "../components/table/helpers";
import type { PaginationInfo } from "@core/types/api";
import { tableRegistry } from "../components/table/table-registry";
import { fetchResourceSuccess } from "../redux/slices/resourceSlice";
import type { DataTableProps, TreeItem } from "@core/types/table";
import type { InertiaPageProps } from "@core/types/inertia";

export type { InertiaPageProps, DataTableProps, TreeItem };

// ==========================================
// UTILITIES
// ==========================================

const flattenTree = <T extends Record<string, unknown>>(
    tree: T[], level = 0, parentId: string | number | null = null, expandedRows?: Set<string | number>
): TreeItem<T>[] =>
    tree.flatMap(node => {
        const { children, ...rest } = node;
        const nodeId = (node.id || rest.id) as string | number;
        // * KISS: Rút gọn check mảng
        const hasChildren = Array.isArray(children) && children.length > 0;
        const current = { ...rest, _level: level, _hasChildren: hasChildren, _parentId: parentId, _id: nodeId } as TreeItem<T>;
        
        const isExpanded = hasChildren && expandedRows?.has(String(nodeId));
        return isExpanded ? [current, ...flattenTree(children as T[], level + 1, nodeId, expandedRows)] : [current];
    });

export const getColumnKey = <TData, TValue>(column: ColumnDef<TData, TValue>): string | undefined =>
    column.id || (column as unknown as Record<string, unknown>).accessorKey as string | undefined;

const normalizePagination = (raw: PaginationInfo | ResourcePagination | null | undefined): PaginationInfo | null => {
    if (!raw) return null;
    const r = ((typeof raw === 'object' && 'meta' in raw && raw.meta) ? raw.meta : raw) as Record<string, unknown>;
    return {
        current_page: (r.current_page as number) ?? 1,
        last_page: (r.last_page as number) ?? 1,
        per_page: (r.per_page as number) ?? 10,
        total: (r.total as number) ?? 0,
        from: (r.from as number) ?? 0,
        to: (r.to as number) ?? 0,
    };
};

const checkTreeMode = (obj: any): boolean =>
    ['tree'].includes(obj?.['load-items'] || obj?.loaditems || obj?.config?.['load-items'] || obj?.config?.loaditems);

const buildAdvancedFilterParams = (params: URLSearchParams, filters: AdvancedFilterCondition[]) => {
    // * DRY: Dùng forEach với Destructuring thay vì for..of loop cục mịch
    filters.forEach(({ field, operator, value }) => {
        if (!field || !operator) return;
        const key = `filters[_and][${field}][${operator}]`;
        
        if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, String(v)));
        } else if (value != null && value !== '') {
            params.append(key, String(value));
        } else if (['_is_null', '_is_not_null'].includes(operator)) {
            params.append(key, '1');
        }
    });
};

// ==========================================
// CUSTOM HOOKS (SRP)
// ==========================================

export function useDataTableRoute(routeProp?: string) {
    const { props } = usePage<InertiaPageProps>();
    const currentRouteName = useMemo(() => props?.ziggy?.route?.name || getCurrentRouteName() || null, [props?.ziggy]);
    const resourceName = useMemo(() => getResourceNameFromRoute(currentRouteName), [currentRouteName]);
    const routeName = routeProp || currentRouteName || null;
    
    const effectiveApiUrl = useMemo(() => {
        if (!routeName) return null;
        try { return route(routeName); } catch { return null; }
    }, [routeName]);

    return { currentRouteName, resourceName, routeName, effectiveApiUrl, effectiveUseApi: Boolean(routeName && effectiveApiUrl), props };
}

// * Mới thêm: Trích xuất logic Local Storage thành hook riêng (SRP)
function useColumnOrderStorage(resourceName: string | null) {
    const [columnOrder, setColumnOrder] = useState<string[]>([]);

    useEffect(() => {
        if (!resourceName) return;
        try {
            const savedOrder = localStorage.getItem(`column_order_${resourceName}`);
            if (savedOrder) setColumnOrder(JSON.parse(savedOrder));
        } catch (e) {
            console.error('Failed to parse column order:', e);
        }
    }, [resourceName]);

    const handleColumnOrderChange = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
        setColumnOrder(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (resourceName) localStorage.setItem(`column_order_${resourceName}`, JSON.stringify(next));
            return next;
        });
    }, [resourceName]);

    return [columnOrder, handleColumnOrderChange] as const;
}

export function useDataTableData<TData, TValue = unknown>(
    { effectiveUseApi, effectiveApiUrl, resourceName, routeName, props }: ReturnType<typeof useDataTableRoute>,
    { itemsProp, dataProp, paginationProp, resourceProp }: { itemsProp?: TData[]; dataProp?: TData[]; paginationProp?: PaginationInfo | ResourcePagination | null; resourceProp?: Resource<TData> },
    { isTreeMode, expandedRows, columnFiltersRef, locale }: { isTreeMode: boolean; expandedRows: Set<string | number>; columnFiltersRef: React.MutableRefObject<ColumnFiltersState>; locale?: string }
) {
    const dispatch = useDispatch();
    const initialData = itemsProp || dataProp || props.items || props.data || null;
    const [tableData, setTableData] = useState<unknown>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiColumns, setApiColumns] = useState<ColumnDef<TData, TValue>[]>([]);
    const [apiFilters, setApiFilters] = useState<DataTableFilter[]>([]);
    
    const lastFetchedUrlRef = useRef<string | null>(null);
    const isFetchingRef = useRef(false);
    const lastPropsRef = useRef<unknown>(initialData);

    const reduxResource = useSelector((state: { resource: Record<string, unknown> }) => routeName ? state.resource[routeName] : null);

    useEffect(() => {
        const newItems = itemsProp || dataProp || props.items || props.data;
        if (newItems !== lastPropsRef.current) {
            lastPropsRef.current = newItems;
            setTableData(newItems);
        }
    }, [itemsProp, dataProp, props.items, props.data]);

    useEffect(() => {
        const resource = (resourceProp || reduxResource) as Resource<TData> | null;
        if (!resource) return;
        
        // * KISS: Loại bỏ clone mảng vô ích (Array Spreading) tránh tạo reference mới liên tục gây vòng lặp render thừa
        if (resource.items) setTableData(resource);
        
        setIsLoading(!!resource.loading);
        if (resource.error !== undefined) setError(resource.error);
    }, [resourceProp, reduxResource]);

    const processApiResponse = useCallback((data: ApiResponse<TData>) => {
        setTableData(data);
        if (data.fields?.length) {
            setApiColumns(fieldsToColumns(data.fields as Record<string, unknown>[], resourceName) as ColumnDef<TData, TValue>[]);
        } else if (data.columns?.length) {
             // * KISS: Dùng Optional Chaining check mảng thay vì Array.isArray lặp lại
            setApiColumns(data.columns as ColumnDef<TData, TValue>[]);
        }
        if (data.filters?.length) setApiFilters(data.filters);
    }, [resourceName]);

    const fetchData = useCallback(async (page: number, limit: number, search?: string, advancedFilters: AdvancedFilterCondition[] = []) => {
        if (!effectiveUseApi || isFetchingRef.current) return;
        isFetchingRef.current = true;
        setError(null);

        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), _t: String(Date.now()) });
            if (locale) params.set('locale', locale);
            if (search) params.set('search', search);
            if (isTreeMode) params.set('tree', 'true');
            
            formatFiltersForAPI(columnFiltersRef.current, []).forEach((value, key) => params.append(key, value));
            buildAdvancedFilterParams(params, advancedFilters);

            if (effectiveApiUrl) {
                setIsLoading(true);
                const response = await axios.get<ApiResponse<TData>>(effectiveApiUrl, { params });
                processApiResponse(response.data);

                if (routeName) {
                    const { data, items, meta, links } = response.data as any;
                    // Hạn chế gọi dispatch request lần 2, ghi thẳng Data từ API vào Saga (KISS & Performance)
                    dispatch(fetchResourceSuccess({ 
                        resource: routeName, 
                        data: (data || items) || [], 
                        pagination: (meta || links) ? (response.data as unknown as ResourcePagination) : undefined 
                    }));
                }
            }
            // * DRY/KISS: Loại bỏ khối else if (routeName) vì đây là DEAD CODE do điều kiện (!effectiveUseApi) đã chặn bên trên
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading data');
            console.error("DataTable fetch error:", err);
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    }, [effectiveUseApi, effectiveApiUrl, isTreeMode, processApiResponse, columnFiltersRef, dispatch, routeName, locale]);

    const updateUrlParams = useCallback((newPage: number, newLimit: number, search?: string, advancedFilters: AdvancedFilterCondition[] = []) => {
        const url = new URL(window.location.href);
        url.searchParams.set('page', String(newPage));
        url.searchParams.set('limit', String(newLimit));
        search ? url.searchParams.set('search', search) : url.searchParams.delete('search');

        if (effectiveUseApi && effectiveApiUrl) {
            window.history.replaceState({}, '', url.toString());
            fetchData(newPage, newLimit, search, advancedFilters);
        } else {
            router.get(url.pathname + url.search, {}, { preserveState: true, preserveScroll: true, replace: true });
        }
    }, [effectiveUseApi, effectiveApiUrl, fetchData]);

    const { items, pagination } = useMemo(() => {
        const raw = tableData || reduxResource || { items: [], pagination: null };
        const extracted = extractFromPaginator<TData>(raw);
        let processedItems = extracted.items;

        if (isTreeMode && processedItems.length > 0 && processedItems.some(i => (i as Record<string, unknown>)?.children)) {
            processedItems = flattenTree(processedItems as Array<Record<string, unknown>>, 0, null, expandedRows) as TData[];
        }

        return {
            // * KISS: Loại bỏ Array.from() vô giá trị, vì processedItems vốn đã là mảng, giảm cấp phát vùng nhớ
            items: processedItems,
            pagination: normalizePagination(
                extracted.pagination || (reduxResource as { pagination?: unknown })?.pagination || paginationProp || props.pagination as PaginationInfo | ResourcePagination | null | undefined
            ),
        };
    }, [tableData, reduxResource, paginationProp, isTreeMode, expandedRows, props.pagination]);

    return { items, pagination, apiColumns, apiFilters, isLoading, error, isFetchingRef, setApiItemsRaw: setTableData, setApiColumns, setApiFilters, fetchData, updateUrlParams, lastFetchedUrlRef };
}

export function useDataTableColumns<TData extends Record<string, unknown>, TValue>(
    { props, effectiveUseApi, resourceName, routeName }: { props: InertiaPageProps; effectiveUseApi: boolean; resourceName: string | null; routeName: string | null },
    { columnsProp, baseColumns }: { columnsProp?: ColumnDef<TData, TValue>[]; baseColumns?: ColumnDef<TData, TValue>[] },
    apiColumns: ColumnDef<TData, TValue>[],
    filters: DataTableFilter[] = []
) {
    const rawColumns = useMemo(() => {
        if (columnsProp) return columnsProp;
        for (const fields of [props.views?.fields, props.configs?.fields]) {
            if (Array.isArray(fields) && fields.length > 0) {
                return fieldsToColumns<TData>(fields as Record<string, unknown>[], resourceName) as ColumnDef<TData, TValue>[];
            }
        }
        return (effectiveUseApi && apiColumns.length > 0) ? apiColumns : (props.columns as ColumnDef<TData, TValue>[] || []);
    }, [columnsProp, props, resourceName, effectiveUseApi, apiColumns]);

    const mergedColumns = useMemo(() => 
        mergeColumns(rawColumns as ColumnDef<TData>[], (baseColumns || []) as ColumnDef<TData>[], resourceName, routeName) as ColumnDef<TData, TValue>[], 
    [rawColumns, baseColumns, resourceName, routeName]);

    const allColumns = useMemo(() => {
        if (!filters.length) return mergedColumns;
        const existingKeys = new Set(mergedColumns.map(getColumnKey).filter(Boolean) as string[]);
        const hidden = filters
            .filter(f => f?.key && !existingKeys.has(f.key))
            .map(f => ({ id: f.key, accessorKey: f.key, header: f.label || f.key, enableHiding: false, enableSorting: false, hidden: true })) as ColumnDef<TData, TValue>[];
        return [...mergedColumns, ...hidden];
    }, [filters, mergedColumns]);

    const columnsWithFilters = useMemo(() =>
        allColumns.map(col => {
            const filter = filters.find(f => f.key === getColumnKey(col) || f.key === col.id);
            return filter ? { ...col, filterFn: createFilterFn(filter) } : col;
        }),
    [allColumns, filters]);

    const initialColumnVisibility = useMemo(() =>
        allColumns.reduce((vis, col) => {
            const id = getColumnKey(col);
            if (id && (col as unknown as Record<string, unknown>).hidden === true) vis[id] = false;
            return vis;
        }, {} as VisibilityState),
    [allColumns]);

    const searchableFields = useMemo(() =>
        mergedColumns.map(getColumnKey).filter((key): key is string => Boolean(key) && key !== 'select' && key !== 'actions'),
    [mergedColumns]);

    return { columns: columnsWithFilters, mergedColumns, initialColumnVisibility, searchableFields };
}

export function useDataTable<TData extends Record<string, unknown>, TValue = unknown>(props: DataTableProps<TData, TValue>) {
    const { i18n } = useTranslation();
    const [tableId] = useState(() => `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const { route: routeProp, pagination: paginationProp, baseColumns, columns: columnsProp, searchKey, globalFilter: propGlobalFilter, onGlobalFilterChange, items: itemsProp, data: dataProp, reorderable, onReorder } = props;
    
    // Core States (SRP / Modular)
    const routeInfo = useDataTableRoute(routeProp);
    const { effectiveUseApi, effectiveApiUrl, routeName, currentRouteName, resourceName } = routeInfo;
    const initialParams = useMemo(() => getUrlParams(), []);

    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterCondition[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    
    // Pagination Custom Hook State
    const normalizedInitialPagination = useMemo(() => normalizePagination(paginationProp), [paginationProp]);
    const [pageSize, setPageSize] = useState(normalizedInitialPagination?.per_page || initialParams.limit || 10);
    const [pageIndex, setPageIndex] = useState(normalizedInitialPagination?.current_page ? normalizedInitialPagination.current_page - 1 : (initialParams.page - 1));
    const [globalFilterState, setGlobalFilterState] = useState(normalizedInitialPagination ? '' : initialParams.search);
    
    const columnFiltersRef = useRef<ColumnFiltersState>(columnFilters);
    const [columnOrder, handleColumnOrderChange] = useColumnOrderStorage(resourceName);

    const isTreeMode = useMemo(() =>
        props.viewMode === 'tree' || checkTreeMode(routeInfo.props.configs) || checkTreeMode(routeInfo.props.views),
    [routeInfo.props.configs, routeInfo.props.views, props.viewMode]);

    const { items, pagination, fetchData, updateUrlParams, setApiItemsRaw, lastFetchedUrlRef, apiColumns, apiFilters, isLoading, error, isFetchingRef, setApiColumns, setApiFilters } =
        useDataTableData<TData, TValue>(routeInfo, { itemsProp, dataProp, paginationProp, resourceProp: props.resource }, { isTreeMode, expandedRows, columnFiltersRef, locale: i18n.language });

    const { columns: columnsWithFilters, mergedColumns, initialColumnVisibility, searchableFields } = useDataTableColumns(
        routeInfo,
        { columnsProp, baseColumns: baseColumns || (defaultBaseColumns as unknown as ColumnDef<TData, TValue>[]) },
        apiColumns,
        apiFilters
    );

    // Context Synchronize Effects
    useEffect(() => { setColumnVisibility(initialColumnVisibility); }, [initialColumnVisibility]);
    useEffect(() => { columnFiltersRef.current = columnFilters; }, [columnFilters]);
    
    useEffect(() => {
        if (!pagination) return;
        setPageSize(pagination.per_page || 10);
        setPageIndex((pagination.current_page || 1) - 1);
    }, [pagination]);

    useEffect(() => {
        if (!routeName) return;
        lastFetchedUrlRef.current = null;
        setApiItemsRaw(null);
        setApiColumns([]);
        setApiFilters([]);
        setAdvancedFilters([]);
        setPageIndex(0);
    }, [routeName, setApiItemsRaw, lastFetchedUrlRef, setApiColumns, setApiFilters]);

    useEffect(() => {
        if (!effectiveUseApi || !effectiveApiUrl || lastFetchedUrlRef.current === effectiveApiUrl) return;
        lastFetchedUrlRef.current = effectiveApiUrl;
        const params = getUrlParams();
        setGlobalFilterState(params.search);
        setPageSize(params.limit);
        setPageIndex(params.page - 1);
        fetchData(params.page, params.limit, params.search);
    }, [effectiveUseApi, effectiveApiUrl, fetchData, lastFetchedUrlRef]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const queryLocale = new URLSearchParams(window.location.search).get('locale');
        if (queryLocale && i18n.language !== queryLocale) i18n.changeLanguage(queryLocale);
    }, [i18n, currentRouteName]);

    // Internal Handlers 
    const globalFilterFn = useCallback((row: { original: TData }, _columnId: string, filterValue: unknown) => {
        const searchValue = filterValue ? String(filterValue).toLowerCase().trim() : '';
        if (!searchValue) return true;
        return searchableFields.some(field => {
            const value = row.original[field];
            if (value == null) return false;
            return (Array.isArray(value) ? value.join(' ') : String(value)).toLowerCase().includes(searchValue);
        });
    }, [searchableFields]);

    const fetchWithReset = useCallback((search?: string, filters: AdvancedFilterCondition[] = []) => {
        if (!effectiveUseApi || !effectiveApiUrl) return;
        setPageIndex(0);
        fetchData(1, pageSize, search ?? globalFilterState, filters);
    }, [effectiveUseApi, effectiveApiUrl, pageSize, globalFilterState, fetchData]);

    const handleColumnFiltersChange = useCallback((updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
        setColumnFilters(prev => {
            const newFilters = typeof updater === 'function' ? updater(prev) : updater;
            columnFiltersRef.current = newFilters;
            if (!isFetchingRef.current) fetchWithReset(globalFilterState, advancedFilters);
            return newFilters;
        });
    }, [fetchWithReset, globalFilterState, advancedFilters, isFetchingRef]);

    const handleAdvancedFilterApply = useCallback(() => fetchWithReset(globalFilterState, advancedFilters), [fetchWithReset, globalFilterState, advancedFilters]);
    const handleAdvancedFilterClear = useCallback(() => {
        setAdvancedFilters([]);
        fetchWithReset(globalFilterState, []);
    }, [fetchWithReset, globalFilterState]);

    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size);
        setPageIndex(0);
        updateUrlParams(1, size, effectiveUseApi ? globalFilterState : undefined, advancedFilters);
    }, [updateUrlParams, effectiveUseApi, globalFilterState, advancedFilters]);

    const handlePageIndexChange = useCallback((index: number) => {
        setPageIndex(index);
        updateUrlParams(index + 1, pageSize, effectiveUseApi ? globalFilterState : undefined, advancedFilters);
    }, [updateUrlParams, pageSize, effectiveUseApi, globalFilterState, advancedFilters]);

    const toggleRowExpansion = useCallback((rowId: string | number) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            const strId = String(rowId);
            if (next.has(strId)) next.delete(strId);
            else next.add(strId);
            return next;
        });
    }, []);

    // React Table Instance Hook Mapping
    const tableInstance = useReactTable({
        data: items,
        columns: columnsWithFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
        pageCount: pagination?.last_page || 1,
        autoResetPageIndex: false,
        autoResetExpanded: false,
        enableRowSelection: true,
        globalFilterFn,
        state: { sorting, columnFilters, columnVisibility, rowSelection, pagination: { pageIndex, pageSize }, columnOrder },
        getRowId: (row, index) => {
            const id = (row as Record<string, unknown>).id;
            return id ? String(id) : String(index);
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: handleColumnFiltersChange,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onColumnOrderChange: handleColumnOrderChange,
        onPaginationChange: updater => {
            const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
            setPageSize(next.pageSize);
            setPageIndex(next.pageIndex);
        },
        onGlobalFilterChange: onGlobalFilterChange ? (value) => onGlobalFilterChange(typeof value === 'string' ? value : '') : setGlobalFilterState,
    });

    const updateSearch = useCallback((value: string) => {
        if (onGlobalFilterChange) onGlobalFilterChange(value);
        else if (searchKey) tableInstance.getColumn(searchKey)?.setFilterValue(value);
        else setGlobalFilterState(value);
        
        if (pagination || effectiveUseApi) {
            setPageIndex(0);
            updateUrlParams(1, pageSize, value, advancedFilters);
        }
    }, [onGlobalFilterChange, searchKey, pagination, effectiveUseApi, pageSize, updateUrlParams, advancedFilters, tableInstance]);

    useEffect(() => {
        tableRegistry.register(tableId, tableInstance, currentRouteName || undefined, { refreshData: fetchData, effectiveUseApi });
        return () => tableRegistry.unregister(tableId);
    }, [tableInstance, tableId, currentRouteName, fetchData, effectiveUseApi]);

    const paginationInfo = useMemo(() => {
        if (pagination) {
            return {
                currentPage: pagination.current_page || 1,
                totalPages: pagination.last_page || 1,
                totalRows: pagination.total || 0,
                pageSize: pagination.per_page || pageSize,
                startRow: pagination.from || 0,
                endRow: pagination.to || 0,
            };
        }
        const totalRows = items.length;
        return {
            currentPage: pageIndex + 1,
            totalPages: Math.ceil(totalRows / pageSize) || 1,
            totalRows,
            pageSize,
            startRow: pageIndex * pageSize + 1,
            endRow: Math.min((pageIndex + 1) * pageSize, totalRows),
        };
    }, [pagination, pageIndex, pageSize, items.length]);

    return {
        table: tableInstance,
        isLoading,
        error,
        mergedColumns,
        searchPlaceholder: props.searchPlaceholder,
        advancedFilters,
        setAdvancedFilters,
        handleAdvancedFilterApply,
        handleAdvancedFilterClear,
        searchValue: propGlobalFilter ?? globalFilterState,
        updateSearch,
        handleSearchClear: useCallback(() => updateSearch(""), [updateSearch]),
        apiFilters,
        effectiveUseApi,
        isTreeMode,
        expandedRows,
        toggleRowExpansion,
        pageSize,
        pageIndex,
        handlePageSizeChange,
        handlePageIndexChange,
        paginationInfo,
        toolbarRow: props.toolbarRow,
        rowSelection,
        columnOrder,
        reorderable,
        onReorder,
        resourceName,
    };
}
