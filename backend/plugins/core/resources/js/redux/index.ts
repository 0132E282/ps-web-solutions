/**
 * Redux Module - API Management Only
 *
 * Provides Redux Toolkit setup and API utilities for CRUD operations
 */

import axios, { AxiosRequestConfig } from 'axios';

// ============================================
// Redux Toolkit Exports
// ============================================
export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';
export { ReduxStoreProvider } from './Provider';

// Export all module slice actions
export {
  // CRUD actions
  setSubmitting,
  setDeleting,
  setLoading,
  setCurrentItemId,

  // Datatable actions
  setTableLoading,
  setPagination,
  setCurrentPage,
  setPerPage,
  setFilters,
  updateFilter,
  clearFilters,
  setSort,
  toggleSort,
  setSearchTerm,
  setSelectedRows,
  toggleRowSelection,
  clearSelectedRows,
  setBulkDeleting,

  // Reset actions
  resetForm,
  resetDatatable,
} from './slices/moduleSlice';

// Export all UI slice actions
export {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  openModal,
  closeModal,
  setLoading as setUILoading,
  setLoadingWithMessage,
  resetUI,
} from './slices/uiSlice';

// Export all resource slice actions
export {
    fetchResourceRequest, fetchResourceSuccess, fetchResourceFailure,
    fetchItemRequest, fetchItemSuccess, fetchItemFailure,
    createResourceRequest, createResourceSuccess, createResourceFailure,
    updateResourceRequest, updateResourceSuccess, updateResourceFailure,
    deleteResourceRequest, deleteResourceSuccess, deleteResourceFailure
} from './slices/resourceSlice';

// Export types
export type {
  FormState,
  PaginationState,
  FilterState,
  SortState
} from './slices/moduleSlice';
export type { UIState } from './slices/uiSlice';

// ============================================
// API Utilities
// ============================================

/**
 * API Request Interfaces
 */
export interface CreateItemRequest {
  url: string;
  data: FormData | Record<string, unknown>;
  config?: AxiosRequestConfig;
}

export interface UpdateItemRequest {
  url: string;
  data: FormData | Record<string, unknown>;
  config?: AxiosRequestConfig;
}

export interface DeleteItemRequest {
  url: string;
  config?: AxiosRequestConfig;
}

export interface FetchItemRequest {
  url: string;
  config?: AxiosRequestConfig;
}

/**
 * API Utilities Class
 * Provides methods for CRUD operations
 */
export class API {
  /**
   * Fetch item(s) from API
   */
  static async fetch<T = unknown>(request: FetchItemRequest): Promise<T> {
    const response = await axios.get(request.url, request.config);
    return response.data;
  }

  /**
   * Create a new item
   */
  static async create<T = unknown>(request: CreateItemRequest): Promise<T> {
    const response = await axios.post(request.url, request.data, {
      ...request.config,
      headers: {
        'Content-Type': request.data instanceof FormData
          ? 'multipart/form-data'
          : 'application/json',
        ...request.config?.headers,
      },
    });
    return response.data;
  }

  /**
   * Update an existing item
   */
  static async update<T = unknown>(request: UpdateItemRequest): Promise<T> {
    const isFormData = request.data instanceof FormData;

    // Laravel compatibility: Use POST with _method=PUT for FormData
    if (isFormData) {
      (request.data as FormData).append('_method', 'PUT');
    }

    const response = await axios.post(request.url, request.data, {
      ...request.config,
      headers: {
        'Content-Type': isFormData
          ? 'multipart/form-data'
          : 'application/json',
        ...request.config?.headers,
      },
    });

    return response.data;
  }

  /**
   * Delete an item
   */
  static async delete<T = unknown>(request: DeleteItemRequest): Promise<T> {
    const response = await axios.delete(request.url, request.config);
    return response.data;
  }
}

/**
 * Hook-based API utilities (for React components)
 */
export const useAPI = () => {
  return {
    fetch: API.fetch,
    create: API.create,
    update: API.update,
    delete: API.delete,
  };
};


