import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ResourceState, ResourcePagination } from '../../types/resource';

// Define a generic type for resource items that MUST have an ID
interface BaseResourceItem {
    id: string | number;
    [key: string]: unknown;
}

interface ResourcesState {
    [key: string]: ResourceState<BaseResourceItem>;
}

const initialState: ResourcesState = {};

const resourceSlice = createSlice({
    name: 'resource',
    initialState,
    reducers: {
        fetchResourceRequest: (state, action: PayloadAction<{ resource: string; params?: Record<string, unknown> }>) => {
            const { resource, params } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: params || null };
            } else {
                state[resource].loading = true;
                state[resource].error = null;
                state[resource].lastParams = params || state[resource].lastParams;
            }
        },
        fetchResourceSuccess: (state, action: PayloadAction<{ resource: string; data: BaseResourceItem[]; pagination?: ResourcePagination }>) => {
            const { resource, data, pagination } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].items = data;
                state[resource].pagination = pagination || null;
            }
        },
        fetchResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        // Single Item
        fetchItemRequest: (state, action: PayloadAction<{ resource: string; id: string | number }>) => {
             const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
                state[resource].error = null;
            }
        },
        fetchItemSuccess: (state, action: PayloadAction<{ resource: string; data: BaseResourceItem }>) => {
             const { resource, data } = action.payload;
             if (state[resource]) {
                state[resource].loading = false;
                state[resource].item = data;
             }
        },
        fetchItemFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        // CUD operations
        createResourceRequest: (state, action: PayloadAction<{ resource: string; data: Record<string, unknown> }>) => {
            const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        createResourceSuccess: (state, action: PayloadAction<{ resource: string; data: BaseResourceItem }>) => {
            const { resource, data } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                // Optimistic update
                if (Array.isArray(state[resource].items)) {
                    state[resource].items.unshift(data);
                }
            }
        },
        createResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
             const { resource, error } = action.payload;
             if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
             }
        },

        updateResourceRequest: (state, action: PayloadAction<{ resource: string; id: string | number; data: Record<string, unknown> }>) => {
             const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        updateResourceSuccess: (state, action: PayloadAction<{ resource: string; data: BaseResourceItem }>) => {
            const { resource, data } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].item = data;
                // Update in items list if it exists
                if (Array.isArray(state[resource].items)) {
                    const index = state[resource].items.findIndex((i) => i.id === data.id);
                    if (index !== -1) {
                        state[resource].items[index] = data;
                    }
                }
            }
        },
        updateResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        deleteResourceRequest: (state, action: PayloadAction<{ resource: string; id: string | number }>) => {
             const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        deleteResourceSuccess: (state, action: PayloadAction<{ resource: string; id: string | number }>) => {
            const { resource, id } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].items = state[resource].items.filter((i) => String(i.id) !== String(id));
                if (state[resource].item && String(state[resource].item?.id) === String(id)) {
                    state[resource].item = null;
                }
            }
        },
        deleteResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        // Duplicate
        duplicateResourceRequest: (state, action: PayloadAction<{ resource: string; id: string | number }>) => {
            const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        duplicateResourceSuccess: (state, action: PayloadAction<{ resource: string; data: BaseResourceItem }>) => {
            const { resource, data } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                if (Array.isArray(state[resource].items)) {
                    state[resource].items.unshift(data);
                }
            }
        },
        duplicateResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        // Restore (from Trash)
        restoreResourceRequest: (state, action: PayloadAction<{ resource: string; id: string | number }>) => {
            const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        restoreResourceSuccess: (state, action: PayloadAction<{ resource: string; id: string | number }>) => {
            const { resource, id } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].items = state[resource].items.filter(i => i.id !== id);
            }
        },
        restoreResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        // Force Delete
        forceDeleteResourceRequest: (state, action: PayloadAction<{ resource: string; id: string | number }>) => {
            const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        forceDeleteResourceSuccess: (state, action: PayloadAction<{ resource: string; id: string | number }>) => {
            const { resource, id } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].items = state[resource].items.filter(i => i.id !== id);
            }
        },
        forceDeleteResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        // Bulk Actions
        bulkDeleteResourceRequest: (state, action: PayloadAction<{ resource: string; ids: (string | number)[] }>) => {
            const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        bulkDeleteResourceSuccess: (state, action: PayloadAction<{ resource: string; ids: (string | number)[] }>) => {
            const { resource, ids } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].items = state[resource].items.filter(i => !ids.includes(i.id));
            }
        },
        bulkDeleteResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        bulkDuplicateResourceRequest: (state, action: PayloadAction<{ resource: string; ids: (string | number)[] }>) => {
            const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        bulkDuplicateResourceSuccess: (state, action: PayloadAction<{ resource: string; data: BaseResourceItem[] }>) => {
            const { resource, data } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].items.unshift(...data);
            }
        },
        bulkDuplicateResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        bulkRestoreResourceRequest: (state, action: PayloadAction<{ resource: string; ids: (string | number)[] }>) => {
            const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        bulkRestoreResourceSuccess: (state, action: PayloadAction<{ resource: string; ids: (string | number)[] }>) => {
            const { resource, ids } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].items = state[resource].items.filter(i => !ids.includes(i.id));
            }
        },
        bulkRestoreResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        bulkForceDeleteResourceRequest: (state, action: PayloadAction<{ resource: string; ids: (string | number)[] }>) => {
            const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        bulkForceDeleteResourceSuccess: (state, action: PayloadAction<{ resource: string; ids: (string | number)[] }>) => {
            const { resource, ids } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].items = state[resource].items.filter(i => !ids.includes(i.id));
            }
        },
        bulkForceDeleteResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        // Import/Export
        importResourceRequest: (state, action: PayloadAction<{ resource: string; formData: FormData }>) => {
            const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        importResourceSuccess: (state, action: PayloadAction<{ resource: string }>) => {
            const { resource } = action.payload;
            if (state[resource]) state[resource].loading = false;
        },
        importResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },

        exportResourceRequest: (state, action: PayloadAction<{ resource: string; params: Record<string, unknown> }>) => {
            const { resource } = action.payload;
            if (!state[resource]) {
                state[resource] = { items: [], item: null, loading: true, error: null, pagination: null, lastParams: null };
            } else {
                state[resource].loading = true;
            }
        },
        exportResourceSuccess: (state, action: PayloadAction<{ resource: string }>) => {
            const { resource } = action.payload;
            if (state[resource]) state[resource].loading = false;
        },
        exportResourceFailure: (state, action: PayloadAction<{ resource: string; error: string }>) => {
            const { resource, error } = action.payload;
            if (state[resource]) {
                state[resource].loading = false;
                state[resource].error = error;
            }
        },
    },
});

export const {
    fetchResourceRequest, fetchResourceSuccess, fetchResourceFailure,
    fetchItemRequest, fetchItemSuccess, fetchItemFailure,
    createResourceRequest, createResourceSuccess, createResourceFailure,
    updateResourceRequest, updateResourceSuccess, updateResourceFailure,
    deleteResourceRequest, deleteResourceSuccess, deleteResourceFailure,
    duplicateResourceRequest, duplicateResourceSuccess, duplicateResourceFailure,
    restoreResourceRequest, restoreResourceSuccess, restoreResourceFailure,
    forceDeleteResourceRequest, forceDeleteResourceSuccess, forceDeleteResourceFailure,
    bulkDeleteResourceRequest, bulkDeleteResourceSuccess, bulkDeleteResourceFailure,
    bulkDuplicateResourceRequest, bulkDuplicateResourceSuccess, bulkDuplicateResourceFailure,
    bulkRestoreResourceRequest, bulkRestoreResourceSuccess, bulkRestoreResourceFailure,
    bulkForceDeleteResourceRequest, bulkForceDeleteResourceSuccess, bulkForceDeleteResourceFailure,
    importResourceRequest, importResourceSuccess, importResourceFailure,
    exportResourceRequest, exportResourceSuccess, exportResourceFailure
} = resourceSlice.actions;

export default resourceSlice.reducer;
