import { PaginationInfo, PaginatorData, ExtractResult } from "@core/types/api";

/**
 * Extract data and pagination info from a paginator-style API response
 */
export const extractFromPaginator = <TData,>(
    paginatorData: unknown
): ExtractResult<TData> => {
    if (!paginatorData) return { items: [], pagination: null };

    const data = paginatorData as PaginatorData<TData>;
    const items = (data.items || data.data);

    if (items && Array.isArray(items)) {
        let pagination: PaginationInfo | null = null;

        // Extract pagination details from direct properties or metadata
        if (typeof data.current_page === 'number' || typeof data.meta?.current_page === 'number') {
            pagination = {
                current_page: data.current_page ?? data.meta?.current_page ?? 1,
                per_page: data.per_page ?? data.meta?.per_page ?? 20,
                total: data.total ?? data.meta?.total ?? 0,
                last_page: data.last_page ?? data.meta?.last_page ?? 1,
                from: data.from ?? data.meta?.from ?? undefined,
                to: data.to ?? data.meta?.to ?? undefined,
            };
        }

        return {
            items: items as TData[],
            pagination
        };
    }

    if (Array.isArray(paginatorData)) {
        return { items: paginatorData as TData[], pagination: null };
    }

    return { items: [], pagination: null };
};
