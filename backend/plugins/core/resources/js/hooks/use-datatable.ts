import { route, getCurrentRouteName } from "@core/lib/route";
import type { ApiResponse } from "@core/types/api";
import type { DataTableFilter } from "@core/types/filter";
import type { ResourcePagination, Resource } from "@core/types/resource";
import { fieldsToColumns, baseColumns as defaultBaseColumns } from "@core/utils/table-columns";
import { router, usePage } from "@inertiajs/react";
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import axios from "axios";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import type { AdvancedFilterCondition } from "../components/advanced-filter";
import { formatFiltersForAPI, getResourceNameFromRoute, mergeColumns, createFilterFn, extractFromPaginator, getUrlParams } from "../components/table/helpers";
import type { PaginationInfo } from "../components/table/helpers";
import { tableRegistry } from "../components/table/table-registry";
import { fetchResourceRequest } from "../redux/slices/resourceSlice";


interface InertiaPageProps extends Record<string, unknown> {
    ziggy?: { route?: { name?: string } };
    columns?: ColumnDef<unknown, unknown>[];
    filters?: DataTableFilter[];
    items?: unknown;
    data?: unknown;
    pagination?: PaginationInfo;
    views?: { fields?: unknown[]; [key: string]: unknown };
    configs?: { fields?: unknown[]; filters?: DataTableFilter[]; 'load-items'?: string; [key: string]: unknown };
}

export interface DataTableProps<TData, TValue> {
    columns?: ColumnDef<TData, TValue>[];
    data?: TData[];
    items?: TData[];
    pagination?: PaginationInfo | ResourcePagination | null;
    baseColumns?: ColumnDef<TData, TValue>[];
    searchKey?: string;
    searchPlaceholder?: string;
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
    route?: string;
    resource?: Resource<TData>;
    toolbarRow?: (row: TData) => React.ReactNode;
}

type TreeItem<T> = T & { _level: number; _hasChildren: boolean; _parentId: string | number | null; _id: string | number };

const flattenTree = <T extends Record<string, unknown>>(
    tree: T[], level = 0, parentId: string | number | null = null, expandedRows?: Set<string | number>
): TreeItem<T>[] => {
    return tree.flatMap(node => {
        const { children, ...rest } = node;
        const nodeId = (node.id || rest.id) as string | number;
        const hasChildren = Array.isArray(children) && children.length > 0;
        const current: TreeItem<T> = { ...rest, _level: level, _hasChildren: hasChildren, _parentId: parentId, _id: nodeId } as TreeItem<T>;

        if (hasChildren && expandedRows?.has(nodeId)) {
            return [current, ...flattenTree(children as T[], level + 1, nodeId, expandedRows)];
        }
        return [current];
    });
};

export const getColumnKey = <TData, TValue>(column: ColumnDef<TData, TValue>): string | undefined =>
    column.id || (column as unknown as Record<string, unknown>).accessorKey as string | undefined;

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
const normalizePagination = (raw: PaginationInfo | ResourcePagination | null | undefined): PaginationInfo | null => {
    if (!raw) return null;

    // Check if it's ResourcePagination (has meta)
    if (typeof raw === 'object' && 'meta' in raw && raw.meta) {
        return {
            current_page: raw.meta.current_page ?? 1,
            last_page: raw.meta.last_page ?? 1,
            per_page: raw.meta.per_page ?? 10,
            total: raw.meta.total ?? 0,
            from: raw.meta.from ?? 0,
            to: raw.meta.to ?? 0
        };
    }

    // It's PaginationInfo or similar
    const r = raw as Record<string, unknown>;
    return {
        current_page: (r.current_page as number) ?? 1,
        last_page: (r.last_page as number) ?? 1,
        per_page: (r.per_page as number) ?? 10,
        total: (r.total as number) ?? 0,
        from: (r.from as number) ?? 0,
        to: (r.to as number) ?? 0
    };
};

export function useDataTableData<TData, TValue = unknown>(
    { effectiveUseApi, effectiveApiUrl, resourceName, routeName, props }: ReturnType<typeof useDataTableRoute>,
    { itemsProp, dataProp, paginationProp, resourceProp }: { itemsProp?: TData[]; dataProp?: TData[]; paginationProp?: PaginationInfo | ResourcePagination | null; resourceProp?: Resource<TData> },
    { isTreeMode, expandedRows, columnFiltersRef }: { isTreeMode: boolean; expandedRows: Set<string | number>; columnFiltersRef: React.MutableRefObject<ColumnFiltersState> }
) {
    const dispatch = useDispatch();
    const [tableData, setTableData] = useState<unknown>(itemsProp || dataProp || props.items || props.data || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiColumns, setApiColumns] = useState<ColumnDef<TData, TValue>[]>([]);
    const [apiFilters, setApiFilters] = useState<DataTableFilter[]>([]);
    const lastFetchedUrlRef = useRef<string | null>(null);
    const isFetchingRef = useRef(false);
    const lastPropsRef = useRef<unknown>(itemsProp || dataProp || props.items || props.data);

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
        if (resource) {
            if (resource.items) setTableData({ ...resource, items: [...(resource.items as unknown[])] });
            if (typeof resource.loading === 'boolean') setIsLoading(resource.loading);
            if (resource.error !== undefined) setError(resource.error);
        }
    }, [resourceProp, reduxResource]);

    const processApiResponse = useCallback((data: ApiResponse<TData>) => {
        setTableData(data);
        if (Array.isArray(data.fields) && data.fields.length > 0) {
            setApiColumns(fieldsToColumns(data.fields as Record<string, unknown>[], resourceName) as ColumnDef<TData, TValue>[]);
        } else if (Array.isArray(data.columns)) {
            setApiColumns(data.columns as ColumnDef<TData, TValue>[]);
        }
        if (Array.isArray(data.filters)) setApiFilters(data.filters);
    }, [resourceName]);

    const fetchData = useCallback(async (page: number, limit: number, search?: string, advancedFilters: AdvancedFilterCondition[] = []) => {
        if (!effectiveUseApi || isFetchingRef.current) return;
        isFetchingRef.current = true;
        setError(null);

        try {
            const params = new URLSearchParams({ page: String(page), limit: String(limit), _t: String(Date.now()) });
            if (search) params.set('search', search);
            if (isTreeMode) params.set('tree', 'true');
            formatFiltersForAPI(columnFiltersRef.current, []).forEach((value, key) => params.append(key, value));
            advancedFilters.forEach((cond) => {
                if (cond.field && cond.operator) {
                    const key = `filters[_and][${cond.field}][${cond.operator}]`;
                    if (Array.isArray(cond.value)) {
                        (cond.value as (string | number)[]).forEach((v) => params.append(`${key}[]`, String(v)));
                    } else if (cond.value !== undefined && cond.value !== null && cond.value !== '') {
                        params.append(key, String(cond.value));
                    } else if (cond.operator === '_is_null' || cond.operator === '_is_not_null') {
                        params.append(key, '1');
                    }
                }
            });

            if (effectiveApiUrl) {
                setIsLoading(true);
                const response = await axios.get<ApiResponse<TData>>(effectiveApiUrl, { params });
                processApiResponse(response.data);
                if (routeName) {
                    const queryParams: Record<string, unknown> = {};
                    params.forEach((value, key) => { queryParams[key] = value; });
                    dispatch(fetchResourceRequest({ resource: routeName, params: queryParams }));
                }
            } else if (routeName) {
                setIsLoading(true);
                const queryParams: Record<string, unknown> = {};
                params.forEach((value, key) => { queryParams[key] = value; });
                dispatch(fetchResourceRequest({ resource: routeName, params: queryParams }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading data');
            console.error("DataTable fetch error:", err);
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    }, [effectiveUseApi, effectiveApiUrl, isTreeMode, processApiResponse, columnFiltersRef, dispatch, routeName]);

    const updateUrlParams = useCallback((newPage: number, newLimit: number, search?: string, advancedFilters: AdvancedFilterCondition[] = []) => {
        const url = new URL(window.location.href);
        url.searchParams.set('page', String(newPage));
        url.searchParams.set('limit', String(newLimit));
        if (search) {
            url.searchParams.set('search', search);
        } else {
            url.searchParams.delete('search');
        }

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

        if (isTreeMode && Array.isArray(processedItems) && processedItems.length > 0) {
            const hasTreeStructure = processedItems.some((item: unknown) => item && typeof item === 'object' && 'children' in item);
            if (hasTreeStructure) processedItems = flattenTree(processedItems as Array<Record<string, unknown>>, 0, null, expandedRows) as TData[];
        }

        const rawPagination = extracted.pagination || (reduxResource as { pagination?: unknown })?.pagination || paginationProp || props.pagination;
        const pagination = normalizePagination(rawPagination as PaginationInfo | ResourcePagination | null | undefined);

        return {
            items: Array.from(processedItems),
            pagination
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
            if (Array.isArray(fields)) {
                const converted = fieldsToColumns<TData>(fields as Record<string, unknown>[], resourceName);
                if (converted.length > 0) return converted as ColumnDef<TData, TValue>[];
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
        allColumns.map(column => {
            const filter = filters.find(f => f.key === getColumnKey(column) || f.key === column.id);
            return filter ? { ...column, filterFn: createFilterFn(filter) } : column;
        }),
    [allColumns, filters]);

    const initialColumnVisibility = useMemo(() =>
        allColumns.reduce((visibility, column) => {
            const columnId = getColumnKey(column);
            if (columnId && (column as unknown as Record<string, unknown>).hidden === true) visibility[columnId] = false;
            return visibility;
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
    const { route: routeProp, pagination: paginationProp, baseColumns, columns: columnsProp, searchKey, globalFilter: propGlobalFilter, onGlobalFilterChange, items: itemsProp, data: dataProp } = props;
    const routeInfo = useDataTableRoute(routeProp);
    const { effectiveUseApi, effectiveApiUrl, routeName, currentRouteName } = routeInfo;
    const initialParams = useMemo(() => getUrlParams(), []);

    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterCondition[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const normalizedInitialPagination = useMemo(() => normalizePagination(paginationProp), [paginationProp]);
    const [pageSize, setPageSize] = useState(normalizedInitialPagination?.per_page || initialParams.limit || 10);
    const [pageIndex, setPageIndex] = useState(normalizedInitialPagination?.current_page ? normalizedInitialPagination.current_page - 1 : (initialParams.page - 1));
    const [globalFilterState, setGlobalFilterState] = useState(normalizedInitialPagination ? '' : initialParams.search);
    const columnFiltersRef = useRef<ColumnFiltersState>(columnFilters);

    const isTreeMode = useMemo(() => routeInfo.props.configs?.['load-items'] === 'tree' || routeInfo.props.views?.['load-items'] === 'tree', [routeInfo.props.configs, routeInfo.props.views]);

    const { items, pagination, fetchData, updateUrlParams, setApiItemsRaw, lastFetchedUrlRef, apiColumns, apiFilters, isLoading, error, isFetchingRef, setApiColumns, setApiFilters } =
        useDataTableData<TData, TValue>(routeInfo, { itemsProp, dataProp, paginationProp, resourceProp: props.resource }, { isTreeMode, expandedRows, columnFiltersRef });

    const { columns: columnsWithFilters, mergedColumns, initialColumnVisibility, searchableFields } = useDataTableColumns(
        routeInfo,
        { columnsProp, baseColumns: baseColumns || (defaultBaseColumns as unknown as ColumnDef<TData, TValue>[]) },
        apiColumns,
        apiFilters
    );

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

    const globalFilterFn = useCallback((row: { original: TData }, _columnId: string, filterValue: unknown) => {
        if (!filterValue) return true;
        const searchValue = String(filterValue).toLowerCase().trim();
        if (!searchValue) return true;
        return searchableFields.some((field) => {
            const value = row.original[field];
            if (value == null) return false;
            const strVal = Array.isArray(value) ? value.join(' ') : String(value);
            return strVal.toLowerCase().includes(searchValue);
        });
    }, [searchableFields]);

    const handleColumnFiltersChange = useCallback((updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
        setColumnFilters((prev) => {
            const newFilters = typeof updater === 'function' ? updater(prev) : updater;
            columnFiltersRef.current = newFilters;
            if (effectiveUseApi && effectiveApiUrl && !isFetchingRef.current) {
                setPageIndex(0);
                fetchData(1, pageSize, globalFilterState, advancedFilters);
            }
            return newFilters;
        });
    }, [effectiveUseApi, effectiveApiUrl, pageSize, globalFilterState, fetchData, advancedFilters, isFetchingRef]);

    const handleAdvancedFilterApply = useCallback(() => {
        if (effectiveUseApi && effectiveApiUrl) {
            setPageIndex(0);
            fetchData(1, pageSize, globalFilterState, advancedFilters);
        }
    }, [effectiveUseApi, effectiveApiUrl, pageSize, globalFilterState, fetchData, advancedFilters]);

    const handleAdvancedFilterClear = useCallback(() => {
        setAdvancedFilters([]);
        if (effectiveUseApi && effectiveApiUrl) {
            setPageIndex(0);
            fetchData(1, pageSize, globalFilterState, []);
        }
    }, [effectiveUseApi, effectiveApiUrl, pageSize, globalFilterState, fetchData]);

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
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(rowId)) {
                next.delete(rowId);
            } else {
                next.add(rowId);
            }
            return next;
        });
    }, []);

    // eslint-disable-next-line react-hooks/incompatible-library
    const tableInstance = useReactTable({
        data: items,
        columns: columnsWithFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: true,
        pageCount: pagination?.last_page || 1,
        autoResetPageIndex: false,
        autoResetExpanded: false,
        state: { sorting, columnFilters, columnVisibility, rowSelection, pagination: { pageIndex, pageSize } },
        getRowId: (row, index) => (row as Record<string, unknown>).id ? String((row as Record<string, unknown>).id) : String(index),
        onSortingChange: setSorting,
        onColumnFiltersChange: handleColumnFiltersChange,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const next = updater({ pageIndex, pageSize });
                setPageSize(next.pageSize);
                setPageIndex(next.pageIndex);
            } else {
                setPageSize(updater.pageSize);
                setPageIndex(updater.pageIndex);
            }
        },
        enableRowSelection: true,
        globalFilterFn,
        getPaginationRowModel: getPaginationRowModel(),
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
    };
}
