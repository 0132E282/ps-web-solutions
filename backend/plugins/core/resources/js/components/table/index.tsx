"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { DataTablePagination } from "./pagination";
import { baseColumns as defaultBaseColumns } from "@core/utils/table-columns";
import { useTranslation } from "react-i18next";
import { tableRegistry } from "./table-registry";
import { getUrlParams } from "./helpers";
import { useDataTableRoute, useDataTableData, useDataTableColumns, DataTableProps } from "./hooks";
import { DataTableToolbar } from "./toolbar";
import { DataTableContent } from "./content";
import { AdvancedFilterCondition } from "../advanced-filter";

export type { DataTableProps };

export function DataTable<TData extends Record<string, unknown>, TValue>({
    columns: columnsProp,
    data: dataProp,
    items: itemsProp,
    pagination: paginationProp,
    baseColumns,
    searchKey,
    searchPlaceholder,
    globalFilter,
    onGlobalFilterChange,
    toolbarRow,
    route: routeProp,
}: DataTableProps<TData, TValue>) {
    const { i18n } = useTranslation();
    const [tableId] = useState(() => `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const { currentRouteName, resourceName, routeName, effectiveApiUrl, effectiveUseApi, props } = useDataTableRoute(routeProp);
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterCondition[]>([]);
    const isTreeMode = useMemo(() =>
        props.configs?.['load-items'] === 'tree' || props.views?.['load-items'] === 'tree',
        [props.configs, props.views]
    );

    const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // Pagination State
    const initialParams = useMemo(() => getUrlParams(), []);
    const [pageSize, setPageSize] = useState(paginationProp?.per_page || initialParams.limit || 10);
    const [pageIndex, setPageIndex] = useState(paginationProp?.current_page ? paginationProp.current_page - 1 : (initialParams.page - 1));
    const [globalFilterState, setGlobalFilterState] = useState(paginationProp ? '' : initialParams.search);

    // Refs for async operations
    const columnFiltersRef = useRef<ColumnFiltersState>(columnFilters);

    // Data fetching & processing
    const {
        items,
        pagination,
        fetchData,
        updateUrlParams,
        setApiItemsRaw,
        lastFetchedUrlRef,
        apiColumns,
        apiFilters,
        isLoading,
        error,
        isFetchingRef,
        setApiColumns,
        setApiFilters
    } = useDataTableData<TData, TValue>(
        { effectiveUseApi, effectiveApiUrl, resourceName, routeName, props, currentRouteName },
        { itemsProp, dataProp, paginationProp },
        { isTreeMode, expandedRows, columnFiltersRef }
        );

    // Columns processing
    const { columns: columnsWithFilters, mergedColumns, initialColumnVisibility, searchableFields } = useDataTableColumns(
        { props, effectiveUseApi, resourceName, routeName },
        {
            columnsProp,
            baseColumns: baseColumns || (defaultBaseColumns as unknown as ColumnDef<TData, TValue>[])
        },
        apiColumns,
        apiFilters
    );

    useEffect(() => {
        setColumnVisibility(initialColumnVisibility);
    }, [initialColumnVisibility]);

    // Sync column filters ref
    useEffect(() => {
        columnFiltersRef.current = columnFilters;
    }, [columnFilters]);

    // Sync pagination from props
    useEffect(() => {
        if (!pagination || !effectiveUseApi) return;
        setPageSize(pagination.per_page || 10);
        setPageIndex((pagination.current_page || 1) - 1);
    }, [pagination, effectiveUseApi]);

    // Reset on route change
    useEffect(() => {
        if (!routeName) return;
        lastFetchedUrlRef.current = null;
        setApiItemsRaw(null);
        setApiColumns([]);
        setApiFilters([]);
        setAdvancedFilters([]);
        setPageIndex(0);
    }, [routeName, setApiItemsRaw, lastFetchedUrlRef, setApiColumns, setApiFilters]);

    // Initial data fetch
    useEffect(() => {
        if (!effectiveUseApi || !effectiveApiUrl || lastFetchedUrlRef.current === effectiveApiUrl) return;

        lastFetchedUrlRef.current = effectiveApiUrl;
        const params = getUrlParams();
        setGlobalFilterState(params.search);
        setPageSize(params.limit);
        setPageIndex(params.page - 1);
        fetchData(params.page, params.limit, params.search);
    }, [effectiveUseApi, effectiveApiUrl, fetchData, lastFetchedUrlRef]);

    // Sync locale
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const queryLocale = new URLSearchParams(window.location.search).get('locale');
        if (queryLocale && i18n.language !== queryLocale) {
            i18n.changeLanguage(queryLocale);
        }
    }, [i18n, currentRouteName]);

    // --- Handlers ---

    // Global filter function
    const globalFilterFn = useCallback((row: { original: TData }, _columnId: string, filterValue: unknown) => {
        if (!filterValue) return true;
        const searchValue = String(filterValue).toLowerCase().trim();
        if (!searchValue) return true;

        const rowData = row.original;
        return searchableFields.some((field) => {
            const value = rowData[field];
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

    // Optimization: Memoize table state
    const tableState = useMemo(() => ({
        sorting,
        columnFilters,
        columnVisibility,
        rowSelection,
        globalFilter: globalFilter ?? globalFilterState,
        pagination: { pageIndex, pageSize },
    }), [sorting, columnFilters, columnVisibility, rowSelection, globalFilter, globalFilterState, pageIndex, pageSize]);

    // TanStack Table instance
    const table = useReactTable({
        data: items,
        columns: columnsWithFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        manualPagination: true,
        pageCount: pagination?.last_page || 1,
        autoResetPageIndex: false,
        state: tableState,
        onSortingChange: setSorting,
        onColumnFiltersChange: handleColumnFiltersChange,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        globalFilterFn: globalFilterFn,
        onGlobalFilterChange: onGlobalFilterChange ?
            (value) => onGlobalFilterChange(typeof value === 'string' ? value : '') :
            setGlobalFilterState,
    });

    // Register table in registry
    useEffect(() => {
        tableRegistry.register(tableId, table, currentRouteName || undefined, {
            refreshData: fetchData,
            effectiveUseApi: effectiveUseApi
        });
        return () => tableRegistry.unregister(tableId);
    }, [table, tableId, currentRouteName, fetchData, effectiveUseApi]);

    // Search handlers
    const searchValue = globalFilter ?? globalFilterState;

    const updateSearch = useCallback((value: string) => {
        if (onGlobalFilterChange) {
            onGlobalFilterChange(value);
        } else if (searchKey) {
            table.getColumn(searchKey)?.setFilterValue(value);
        } else {
            setGlobalFilterState(value);
        }

        if (pagination || effectiveUseApi) {
            setPageIndex(0);
            updateUrlParams(1, pageSize, value, advancedFilters);
        }
    }, [onGlobalFilterChange, searchKey, table, pagination, effectiveUseApi, pageSize, updateUrlParams, advancedFilters]);

    const handleSearchClear = useCallback(() => {
        updateSearch("");
    }, [updateSearch]);

    // Pagination handlers
    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size);
        setPageIndex(0);
        updateUrlParams(1, size, effectiveUseApi ? globalFilterState : undefined, advancedFilters);
    }, [updateUrlParams, effectiveUseApi, globalFilterState, advancedFilters]);

    const handlePageIndexChange = useCallback((index: number) => {
        setPageIndex(index);
        updateUrlParams(index + 1, pageSize, effectiveUseApi ? globalFilterState : undefined, advancedFilters);
    }, [updateUrlParams, pageSize, effectiveUseApi, globalFilterState, advancedFilters]);

    // Tree expansion handler
    const toggleRowExpansion = useCallback((rowId: string | number) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            next.has(rowId) ? next.delete(rowId) : next.add(rowId);
            return next;
        });
    }, []);

    // Pagination info
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

    return (
        <div className="w-full space-y-4">
            <DataTableToolbar
                table={table}
                searchValue={searchValue}
                onSearchChange={updateSearch}
                onSearchClear={handleSearchClear}
                searchPlaceholder={searchPlaceholder}
                apiFilters={apiFilters}
                mergedColumns={mergedColumns}
                advancedFilters={advancedFilters}
                onAdvancedFiltersChange={setAdvancedFilters}
                onAdvancedFilterApply={handleAdvancedFilterApply}
                onAdvancedFilterClear={handleAdvancedFilterClear}
                effectiveUseApi={effectiveUseApi}
            />

            <DataTableContent
                table={table}
                isLoading={isLoading}
                error={error}
                mergedColumnsLength={mergedColumns.length}
                isTreeMode={isTreeMode}
                expandedRows={expandedRows}
                onToggleRowExpansion={toggleRowExpansion}
                toolbarRow={toolbarRow}
            />

            <DataTablePagination
                table={table}
                pageSize={pageSize}
                setPageSize={handlePageSizeChange}
                pageIndex={pageIndex}
                setPageIndex={handlePageIndexChange}
                paginationInfo={paginationInfo}
            />
        </div>
    );
}
