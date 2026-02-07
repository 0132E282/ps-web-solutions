import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
export { store } from './store';
export type { RootState, AppDispatch } from './store';
export { useAppDispatch, useAppSelector } from './hooks';
export { ReduxStoreProvider } from './Provider';

// Export all module slice actions
export {
  setSubmitting,
  setDeleting,
  setLoading,
  setCurrentItemId,
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
  resetForm,
  resetDatatable,
} from './slices/moduleSlice';
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

export {
    fetchResourceRequest, fetchResourceSuccess, fetchResourceFailure,
    fetchItemRequest, fetchItemSuccess, fetchItemFailure,
    createResourceRequest, createResourceSuccess, createResourceFailure,
    updateResourceRequest, updateResourceSuccess, updateResourceFailure,
    deleteResourceRequest, deleteResourceSuccess, deleteResourceFailure
} from './slices/resourceSlice';

export type {
  FormState,
  PaginationState,
  FilterState,
  SortState
} from './slices/moduleSlice';
export type { UIState } from './slices/uiSlice';

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

export class API {
  static async fetch<T = unknown>(request: FetchItemRequest): Promise<T> {
    const response = await axios.get(request.url, request.config);
    return response.data;
  }

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

  static async update<T = unknown>(request: UpdateItemRequest): Promise<T> {
    const isFormData = request.data instanceof FormData;

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

  static async delete<T = unknown>(request: DeleteItemRequest): Promise<T> {
    const response = await axios.delete(request.url, request.config);
    return response.data;
  }
}

export const useAPI = () => {
  return {
    fetch: API.fetch,
    create: API.create,
    update: API.update,
    delete: API.delete,
  };
};


