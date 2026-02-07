import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
    ColumnDef,
    ColumnFiltersState,
    VisibilityState,
} from "@tanstack/react-table";
import { fieldsToColumns } from "@core/utils/table-columns";
import { route, getCurrentRouteName } from "@core/lib/route";
import {
    formatFiltersForAPI,
    getResourceNameFromRoute,
    mergeColumns,
    createFilterFn,
    extractFromPaginator,
    PaginationInfo,
} from "./helpers";
import { fetchResourceRequest } from "../../redux/slices/resourceSlice";
import type { ApiResponse } from "@core/types/api";
import type { DataTableFilter } from "@core/types/filter";
import type { AdvancedFilterCondition } from "../advanced-filter";

// --- Types ---

interface InertiaPageProps extends Record<string, unknown> {
    ziggy?: { route?: { name?: string } };
    columns?: ColumnDef<unknown, unknown>[];
    filters?: DataTableFilter[];
    items?: unknown;
    data?: unknown;
    pagination?: PaginationInfo;
    views?: {
        fields?: unknown[];
        [key: string]: unknown;
    };
    configs?: {
        fields?: unknown[];
        filters?: DataTableFilter[];
        'load-items'?: string;
        [key: string]: unknown;
    };
}

export interface DataTableProps<TData, TValue> {
    columns?: ColumnDef<TData, TValue>[];
    data?: TData[];
    items?: TData[];
    pagination?: PaginationInfo | null;
    baseColumns?: ColumnDef<TData, TValue>[];
    searchKey?: string;
    searchPlaceholder?: string;
    searchFields?: string[];
    globalFilter?: string;
    onGlobalFilterChange?: (value: string) => void;
    route?: string;
    toolbarRow?: (row: TData) => React.ReactNode;
}

type TreeItem<T> = T & { _level: number; _hasChildren: boolean; _parentId: string | number | null; _id: string | number };

// --- Logic Helpers ---

const flattenTree = <T extends Record<string, unknown>>(
    tree: T[],
    level = 0,
    parentId: string | number | null = null,
    expandedRows?: Set<string | number>
): TreeItem<T>[] => {
    return tree.flatMap(node => {
        const { children, ...rest } = node;
        const nodeId = (node.id || rest.id) as string | number;
        const hasChildren = Array.isArray(children) && children.length > 0;

        const current: TreeItem<T> = { ...rest, _level: level, _hasChildren: hasChildren, _parentId: parentId, _id: nodeId } as TreeItem<T>;

        if (hasChildren) {
            let shouldExpand = true;
            if (expandedRows) {
                // Robust check: Check exact value OR string representation to handle type mismatches
                 shouldExpand = expandedRows.has(nodeId) || expandedRows.has(String(nodeId)) || expandedRows.has(Number(nodeId));
            }

            if (shouldExpand) {
                 return [current, ...flattenTree(children as T[], level + 1, nodeId, expandedRows)];
            }
        }

        return [current];
    });
};

export const getColumnKey = <TData, TValue>(column: ColumnDef<TData, TValue>): string | undefined =>
    column.id || (column as unknown as Record<string, unknown>).accessorKey as string | undefined;

// --- Hooks ---

export function useDataTableRoute(routeProp?: string) {
    const { props } = usePage<InertiaPageProps>();
    const currentRouteName = useMemo(() =>
        props?.ziggy?.route?.name || getCurrentRouteName() || null,
        [props?.ziggy]
    );
    const resourceName = useMemo(() => getResourceNameFromRoute(currentRouteName), [currentRouteName]);
    const routeName = routeProp || currentRouteName || null;

    const effectiveApiUrl = useMemo(() => {
        if (!routeName) return null;
        try {
            return route(routeName);
        } catch {
            return null;
        }
    }, [routeName]);

    return {
        currentRouteName,
        resourceName,
        routeName,
        effectiveApiUrl,
        effectiveUseApi: Boolean(routeName && effectiveApiUrl),
        props
    };
}

export function useDataTableData<TData, TValue = unknown>(
    { effectiveUseApi, effectiveApiUrl, resourceName, routeName, props }: ReturnType<typeof useDataTableRoute>,
    { itemsProp, dataProp, paginationProp }: { itemsProp?: TData[], dataProp?: TData[], paginationProp?: PaginationInfo | null },
    { isTreeMode, expandedRows, columnFiltersRef }: {
        isTreeMode: boolean;
        expandedRows: Set<string | number>;
        columnFiltersRef: React.MutableRefObject<ColumnFiltersState>;
    }
) {
    const dispatch = useDispatch();

    const [tableData, setTableData] = useState<unknown>(itemsProp || dataProp || props.items || props.data || null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiColumns, setApiColumns] = useState<ColumnDef<TData, TValue>[]>([]);
    const [apiFilters, setApiFilters] = useState<DataTableFilter[]>([]);

    const lastFetchedUrlRef = useRef<string | null>(null);
    const isFetchingRef = useRef(false);
    // Track the last applied props to prevent overwriting fresh API data with stale props during re-renders
    const lastPropsRef = useRef<unknown>(itemsProp || dataProp || props.items || props.data);

    // Sync with props when they change
    useEffect(() => {
        const newItems = itemsProp || dataProp || props.items || props.data;
        if (newItems !== lastPropsRef.current) {
            lastPropsRef.current = newItems;
            setTableData(newItems);
        }
    }, [itemsProp, dataProp, props.items, props.data]);

    // Get data from Redux if routeName is available
    const reduxResource = useSelector((state: { resource: Record<string, unknown> }) =>
        routeName ? state.resource[routeName] : null
    );

    // Redux sync effect - sync whenever Redux resource changes
    useEffect(() => {
        const resource = reduxResource as Record<string, unknown> | null;
        if (resource?.items) {
             setTableData(resource);
        }
    }, [reduxResource, routeName, resourceName]);

    const processApiResponse = useCallback((data: ApiResponse<TData>) => {
        // Update the single source of truth
        setTableData(data);

        if (Array.isArray(data.fields) && data.fields.length > 0) {
            setApiColumns(fieldsToColumns(data.fields as Record<string, unknown>[], resourceName) as ColumnDef<TData, TValue>[]);
        } else if (Array.isArray(data.columns)) {
            setApiColumns(data.columns as ColumnDef<TData, TValue>[]);
        }

        if (Array.isArray(data.filters)) {
            setApiFilters(data.filters);
        }
    }, [resourceName]);

    const fetchData = useCallback(async (page: number, limit: number, search?: string, advancedFilters: AdvancedFilterCondition[] = []) => {
        if (!effectiveUseApi || isFetchingRef.current) return;

        isFetchingRef.current = true;
        setIsLoading(false); // Set to false initially, will be true if actual fetch starts
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                _t: String(Date.now()), // Prevent caching
            });

            if (search) params.set('search', search);
            if (isTreeMode) params.set('tree', 'true');

            // Add standard column filters
            const filterParams = formatFiltersForAPI(columnFiltersRef.current, []);
            filterParams.forEach((value, key) => params.append(key, value));

            // Add advanced filters
            if (advancedFilters && advancedFilters.length > 0) {
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
            }

            if (effectiveApiUrl) {
                setIsLoading(true); // Set loading true only if API call is made
                const response = await axios.get<ApiResponse<TData>>(effectiveApiUrl, { params });
                processApiResponse(response.data);

                // Optional: Sync with Redux if needed, but don't block
                if (routeName) {
                    const queryParams: Record<string, unknown> = {};
                    params.forEach((value, key) => {
                        queryParams[key] = value;
                    });
                    // We don't await this as we have local data
                    dispatch(fetchResourceRequest({ resource: routeName, params: queryParams }));
                }
            } else if (routeName) {
                // Fallback to Redux-only if no direct URL is resolved (unlikely if effectiveUseApi is true)
                setIsLoading(true); // Set loading true for Redux fetch
                const queryParams: Record<string, unknown> = {};
                params.forEach((value, key) => {
                    queryParams[key] = value;
                });
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
        // Use tableData directly as the source of truth
        const raw = tableData || { items: [], pagination: null };

        const extracted = extractFromPaginator<TData>(raw);

        let processedItems = extracted.items;

        if (isTreeMode && Array.isArray(processedItems) && processedItems.length > 0) {
            const hasTreeStructure = processedItems.some(
                (item: unknown) => item && typeof item === 'object' && 'children' in item
            );
            if (hasTreeStructure) {
                processedItems = flattenTree(
                    processedItems as Array<Record<string, unknown>>,
                    0,
                    null,
                    expandedRows
                ) as TData[];
            }
        }

        return {
            items: processedItems,
            pagination: extracted.pagination || (reduxResource as { pagination?: PaginationInfo })?.pagination || paginationProp || props.pagination
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableData, reduxResource, paginationProp, props, isTreeMode, dispatch, expandedRows]); // Added expandedRows to deps

    return {
        items,
        pagination,
        apiColumns,
        apiFilters,
        isLoading,
        error,
        isFetchingRef, // Expose for specific checks if needed
        setApiItemsRaw: setTableData,
        setApiColumns,
        setApiFilters,
        setExpandedRows: null, // Note: Expanded rows state is still external in index.tsx? No, we used `expandedRows` from props.
        fetchData,
        updateUrlParams,
        lastFetchedUrlRef
    };
}

export function useDataTableColumns<TData extends Record<string, unknown>, TValue>(
    { props, effectiveUseApi, resourceName, routeName }: { props: InertiaPageProps, effectiveUseApi: boolean, resourceName: string | null, routeName: string | null },
    { columnsProp, baseColumns }: { columnsProp?: ColumnDef<TData, TValue>[], baseColumns?: ColumnDef<TData, TValue>[] },
    apiColumns: ColumnDef<TData, TValue>[],
    filters: DataTableFilter[] = []
) {
    const rawColumns = useMemo(() => {
        if (columnsProp) return columnsProp;

        // Try views fields, then configs fields
        for (const fields of [props.views?.fields, props.configs?.fields]) {
            if (Array.isArray(fields)) {
                const converted = fieldsToColumns<TData>(fields as Record<string, unknown>[], resourceName);
                if (converted.length > 0) return converted as ColumnDef<TData, TValue>[];
            }
        }

        return (effectiveUseApi && apiColumns.length > 0) ? apiColumns : (props.columns as ColumnDef<TData, TValue>[] || []);
    }, [columnsProp, props, resourceName, effectiveUseApi, apiColumns]);

    const mergedColumns = useMemo(() => {
        return mergeColumns(rawColumns as ColumnDef<TData>[], (baseColumns || []) as ColumnDef<TData>[], resourceName, routeName) as ColumnDef<TData, TValue>[];
    }, [rawColumns, baseColumns, resourceName, routeName]);

    const { allColumns } = useMemo(() => {
        if (!filters.length) return { hiddenFilterColumns: [], allColumns: mergedColumns };

        const existingKeys = new Set(mergedColumns.map(getColumnKey).filter(Boolean) as string[]);
        const hidden = filters
            .filter(f => f?.key && !existingKeys.has(f.key))
            .map(f => ({ id: f.key, accessorKey: f.key, header: f.label || f.key, enableHiding: false, enableSorting: false, hidden: true })) as ColumnDef<TData, TValue>[];

        return { hiddenFilterColumns: hidden, allColumns: [...mergedColumns, ...hidden] };
    }, [filters, mergedColumns]);

    const columnsWithFilters = useMemo(() =>
        allColumns.map(column => {
            const filter = filters.find(f => f.key === getColumnKey(column) || f.key === column.id);
            return filter ? { ...column, filterFn: createFilterFn(filter) } : column;
        }), [allColumns, filters]);

    const initialColumnVisibility = useMemo(() =>
        allColumns.reduce((visibility, column) => {
            const columnId = getColumnKey(column);
            if (columnId && (column as unknown as Record<string, unknown>).hidden === true) {
                visibility[columnId] = false;
            }
            return visibility;
        }, {} as VisibilityState), [allColumns]);

    const searchableFields = useMemo(() =>
        mergedColumns
            .map(getColumnKey)
            .filter((key): key is string => Boolean(key) && key !== 'select' && key !== 'actions'),
        [mergedColumns]);

    return {
        columns: columnsWithFilters,
        mergedColumns,
        initialColumnVisibility,
        searchableFields
    };
}
