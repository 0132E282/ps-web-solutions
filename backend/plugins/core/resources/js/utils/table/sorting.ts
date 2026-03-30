import { SortingState } from "@tanstack/react-table";

/**
 * Format sorting state for API requests
 * Converts SortingState to format: sorts[0][order]=desc&sorts[0][column]=column_name
 */
export const formatSortingForAPI = (sorting: SortingState): URLSearchParams => {
    const params = new URLSearchParams();

    // Single column sorting support (API limitation)
    if (sorting.length > 0 && sorting[0]?.id) {
        const sort = sorting[0];
        params.append('sorts[0][column]', sort.id);
        params.append('order[0][order]', sort.desc ? 'desc' : 'asc');
    }

    return params;
};
