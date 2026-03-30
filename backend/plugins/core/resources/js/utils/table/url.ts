import { UrlParams } from "@core/types/api";
import { decodeFilters } from "./filters";

/**
 * Extract parameters from URL for current table state
 */
export const getUrlParams = (): UrlParams => {
    if (typeof window === 'undefined') {
        return { page: 1, limit: 10, search: '', filters: [], advancedFilters: [] };
    }
    const urlParams = new URLSearchParams(window.location.search);
    const encodedFilters = urlParams.get('f');
    const decoded = decodeFilters<any>(encodedFilters);
    
    let filters: any[] = [];
    let advancedFilters: any[] = [];

    if (Array.isArray(decoded)) {
        // Backward compatibility for old simple array format
        filters = decoded;
    } else if (decoded && typeof decoded === 'object') {
        filters = decoded.cf || [];
        advancedFilters = decoded.af || [];
    }
    
    return {
        page: parseInt(urlParams.get('page') || '1', 10),
        limit: parseInt(urlParams.get('limit') || '10', 10),
        search: urlParams.get('search') || '',
        filters,
        advancedFilters,
        sorting: urlParams.get('sorts[0][column]') 
            ? [{ id: urlParams.get('sorts[0][column]')!, desc: urlParams.get('order[0][order]') === 'desc' }] 
            : [{ id: 'id', desc: true }],
    };
};

/**
 * Get the resource name based on the route name (segments like admin.posts.index)
 */
export const getResourceNameFromRoute = (routeName: string | null): string | null => {
    if (!routeName) return null;

    const segments = routeName.split('.');

    // Standard admin route (admin.resource.action) -> use second segment
    if (segments[0] === 'admin' && segments.length >= 2) {
        return segments[1] || null;
    }

    // Fallback: take the first non-admin segment
    return segments[0] !== 'admin' ? segments[0] : null;
};
