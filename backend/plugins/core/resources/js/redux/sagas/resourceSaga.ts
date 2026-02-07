import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { axios } from '@core/lib/axios';
import i18n from '@core/lib/i18n';
import { route } from '@core/lib/route';
import {
    fetchResourceRequest, fetchResourceSuccess, fetchResourceFailure,
    updateResourceRequest, updateResourceSuccess, updateResourceFailure,
    createResourceRequest, createResourceSuccess, createResourceFailure,
    deleteResourceRequest, deleteResourceSuccess, deleteResourceFailure,
    fetchItemRequest, fetchItemSuccess, fetchItemFailure,
    duplicateResourceRequest, duplicateResourceSuccess, duplicateResourceFailure,
    restoreResourceRequest, restoreResourceSuccess, restoreResourceFailure,
    forceDeleteResourceRequest, forceDeleteResourceSuccess, forceDeleteResourceFailure,
    bulkDeleteResourceRequest, bulkDeleteResourceSuccess, bulkDeleteResourceFailure,
    bulkDuplicateResourceRequest, bulkDuplicateResourceSuccess, bulkDuplicateResourceFailure,
    bulkRestoreResourceRequest, bulkRestoreResourceSuccess, bulkRestoreResourceFailure,
    bulkForceDeleteResourceRequest, bulkForceDeleteResourceSuccess, bulkForceDeleteResourceFailure,
    importResourceRequest, importResourceSuccess, importResourceFailure,
    exportResourceRequest, exportResourceSuccess, exportResourceFailure
} from '../slices/resourceSlice';
import { PayloadAction } from '@reduxjs/toolkit';

// Define expected item shape matching slice
interface ResourceItem {
    id: string | number;
    [key: string]: unknown;
}

// API Functions
// Helper to determine if input is a route name or direct path
const getUrl = (resource: string, params?: Record<string, unknown>) => {
    // If it looks like a route name (contains dots), use route helper
    // Otherwise append to base
    return resource.includes('.') ? route(resource, params as Record<string, string | number | boolean | null | undefined>) : `/${resource}`;
};

const getCommonParams = () => ({
    locale: i18n.language,
});

const api = {
    fetch: (resource: string, params?: Record<string, unknown>) => {
        const finalParams = { ...params, ...getCommonParams() };
        return axios.get(getUrl(resource, finalParams), resource.includes('.') ? undefined : { params: finalParams });
    },
    fetchOne: (resource: string, id: string | number) => {
        const finalParams = getCommonParams();
        const url = resource.includes('.')
            ? route(resource.replace(/\.index$/, '').replace(/\.?$/, '.show'), { id, ...finalParams })
            : `/${resource}/${id}`;
        return axios.get(url, resource.includes('.') ? undefined : { params: finalParams });
    },
    create: (resource: string, data: Record<string, unknown>) => {
        const finalParams = getCommonParams();
        const url = resource.includes('.')
            ? route(resource.replace(/\.index$/, '').replace(/\.?$/, '.store'), finalParams)
            : `/${resource}/store`;
        return axios.post(url, data, { params: finalParams });
    },
    update: (resource: string, id: string | number, data: Record<string, unknown>) => {
        const finalParams = getCommonParams();
        const url = resource.includes('.')
            ? route(resource.replace(/\.index$/, '').replace(/\.?$/, '.update'), { id, ...finalParams })
            : `/${resource}/${id}`;
        return axios.put(url, data, { params: finalParams });
    },
    delete: (resource: string, id: string | number) => {
        const finalParams = getCommonParams();
        const url = resource.includes('.')
            ? route(resource.replace(/\.index$/, '').replace(/\.?$/, '.destroy'), { id, ...finalParams })
            : `/${resource}/${id}`;
        return axios.delete(url, { params: finalParams });
    },
    duplicate: (resource: string, id: string | number) => {
        const finalParams = getCommonParams();
        const url = resource.includes('.')
            ? route(resource.replace(/\.index$/, '').replace(/\.?$/, '.duplicate'), { id, ...finalParams })
            : `/${resource}/${id}/duplicate`;
        return axios.post(url, undefined, { params: finalParams });
    },
    restore: (resource: string, id: string | number) => {
        const finalParams = getCommonParams();
        const url = resource.includes('.')
            ? route(resource.replace(/\.index$/, '').replace(/\.?$/, '.restore'), { id, ...finalParams })
            : `/${resource}/${id}/restore`;
        return axios.post(url, undefined, { params: finalParams });
    },
    forceDelete: (resource: string, id: string | number) => {
        const finalParams = getCommonParams();
        const url = resource.includes('.')
            ? route(resource.replace(/\.index$/, '').replace(/\.?$/, '.force-delete'), { id, ...finalParams })
            : `/${resource}/${id}/force-delete`;
        return axios.delete(url, { params: finalParams });
    },
    bulkDelete: (resource: string, ids: (string | number)[]) => {
        const finalParams = getCommonParams();
        const url = getUrl(resource, finalParams);
        return axios.delete(url, { data: { ids }, params: finalParams });
    },
    bulkDuplicate: (resource: string, ids: (string | number)[]) => {
        const finalParams = getCommonParams();
        const url = getUrl(resource, finalParams) + '/duplicate';
        return axios.post(url, { ids }, { params: finalParams });
    },
    bulkRestore: (resource: string, ids: (string | number)[]) => {
        const finalParams = getCommonParams();
        const url = getUrl(resource, finalParams) + '/restore';
        return axios.post(url, { ids }, { params: finalParams });
    },
    bulkForceDelete: (resource: string, ids: (string | number)[]) => {
        const finalParams = getCommonParams();
        const url = getUrl(resource, finalParams) + '/force-delete';
        return axios.delete(url, { data: { ids }, params: finalParams });
    },
    import: (resource: string, formData: FormData) => {
        const finalParams = getCommonParams();
        const url = getUrl(resource, finalParams) + '/import';
        return axios.post(url, formData, {
            params: finalParams,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    export: (resource: string, params: Record<string, unknown>) => {
        const finalParams = { ...params, ...getCommonParams() };
        const url = getUrl(resource, finalParams) + '/export';
        return axios.get(url, { params: finalParams, responseType: 'blob' });
    }
};

interface ApiResponse<T = unknown> {
    data: {
        data: T;
        meta?: unknown;
        links?: unknown;
        items?: T;
    };
}

// Selector helper
const selectLastParams = (resource: string) => (state: { resource: Record<string, any> }) => state.resource[resource]?.lastParams;

// Re-fetch helper saga
function* reFetchResource(resource: string) {
    const lastParams: Record<string, unknown> | null = yield select(selectLastParams(resource));
    yield put(fetchResourceRequest({ resource, params: lastParams || undefined }));
}

function* handleFetchResource(action: PayloadAction<{ resource: string; params?: Record<string, unknown> }>) {
    const { resource, params } = action.payload;
    try {
        const response: ApiResponse<ResourceItem[]> = yield call(api.fetch, resource, params);
        // Normalize response
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData = response.data as any;
        const data = (rawData?.data || rawData?.items || response.data) as ResourceItem[];

        const pagination = (rawData?.meta || rawData?.links) ? rawData : null;

        yield put(fetchResourceSuccess({ resource, data, pagination }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        yield put(fetchResourceFailure({ resource, error: error.response?.data?.message || error.message }));
    }
}

function* handleFetchItem(action: PayloadAction<{ resource: string; id: string | number }>) {
    const { resource, id } = action.payload;
    try {
        const response: ApiResponse = yield call(api.fetchOne, resource, id);
        const data = (response.data?.data || response.data) as ResourceItem;
        yield put(fetchItemSuccess({ resource, data }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        yield put(fetchItemFailure({ resource, error: error.response?.data?.message || error.message }));
    }
}

function* handleCreateResource(action: PayloadAction<{ resource: string; data: Record<string, unknown> }>) {
    const { resource, data } = action.payload;
    try {
        const response: ApiResponse = yield call(api.create, resource, data);
        const newData = (response.data?.data || response.data) as ResourceItem;
        yield put(createResourceSuccess({ resource, data: newData }));
        yield call(reFetchResource, resource);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        yield put(createResourceFailure({ resource, error: error.response?.data?.message || error.message }));
    }
}

function* handleUpdateResource(action: PayloadAction<{ resource: string; id: string | number; data: Record<string, unknown> }>) {
    const { resource, id, data } = action.payload;
    try {
        const response: ApiResponse = yield call(api.update, resource, id, data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData = response.data as any;
        // Fix: Ensure we extract the data correctly, handling wrapped or direct responses
        const updatedData = (rawData?.data || response.data) as ResourceItem;
        yield put(updateResourceSuccess({ resource, data: updatedData }));
        yield call(reFetchResource, resource);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        yield put(updateResourceFailure({ resource, error: error.response?.data?.message || error.message }));
    }
}

function* handleDeleteResource(action: PayloadAction<{ resource: string; id: string | number }>) {
    const { resource, id } = action.payload;
    try {
        yield call(api.delete, resource, id);
        yield put(deleteResourceSuccess({ resource, id }));
        yield call(reFetchResource, resource);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        yield put(deleteResourceFailure({ resource, error: error.response?.data?.message || error.message }));
    }
}

function* handleDuplicateResource(action: PayloadAction<{ resource: string; id: string | number }>) {
    const { resource, id } = action.payload;
    try {
        const response: ApiResponse = yield call(api.duplicate, resource, id);
        const data = (response.data?.data || response.data) as ResourceItem;
        yield put(duplicateResourceSuccess({ resource, data }));
        yield call(reFetchResource, resource);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const responseData = (error as { response?: { data?: { message?: string } } }).response?.data;
        yield put(duplicateResourceFailure({ resource, error: responseData?.message || message }));
    }
}

function* handleRestoreResource(action: PayloadAction<{ resource: string; id: string | number }>) {
    const { resource, id } = action.payload;
    try {
        yield call(api.restore, resource, id);
        yield put(restoreResourceSuccess({ resource, id }));
        yield call(reFetchResource, resource);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const responseData = (error as { response?: { data?: { message?: string } } }).response?.data;
        yield put(restoreResourceFailure({ resource, error: responseData?.message || message }));
    }
}

function* handleForceDeleteResource(action: PayloadAction<{ resource: string; id: string | number }>) {
    const { resource, id } = action.payload;
    try {
        yield call(api.forceDelete, resource, id);
        yield put(forceDeleteResourceSuccess({ resource, id }));
        yield call(reFetchResource, resource);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const responseData = (error as { response?: { data?: { message?: string } } }).response?.data;
        yield put(forceDeleteResourceFailure({ resource, error: responseData?.message || message }));
    }
}

function* handleBulkDeleteResource(action: PayloadAction<{ resource: string; ids: (string | number)[] }>) {
    const { resource, ids } = action.payload;
    try {
        yield call(api.bulkDelete, resource, ids);
        yield put(bulkDeleteResourceSuccess({ resource, ids }));
        yield call(reFetchResource, resource);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const responseData = (error as { response?: { data?: { message?: string } } }).response?.data;
        yield put(bulkDeleteResourceFailure({ resource, error: responseData?.message || message }));
    }
}

function* handleBulkDuplicateResource(action: PayloadAction<{ resource: string; ids: (string | number)[] }>) {
    const { resource, ids } = action.payload;
    try {
        const response: ApiResponse = yield call(api.bulkDuplicate, resource, ids);
        const data = (response.data?.data || response.data) as ResourceItem[];
        yield put(bulkDuplicateResourceSuccess({ resource, data }));
        yield call(reFetchResource, resource);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const responseData = (error as { response?: { data?: { message?: string } } }).response?.data;
        yield put(bulkDuplicateResourceFailure({ resource, error: responseData?.message || message }));
    }
}

function* handleBulkRestoreResource(action: PayloadAction<{ resource: string; ids: (string | number)[] }>) {
    const { resource, ids } = action.payload;
    try {
        yield call(api.bulkRestore, resource, ids);
        yield put(bulkRestoreResourceSuccess({ resource, ids }));
        yield call(reFetchResource, resource);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const responseData = (error as { response?: { data?: { message?: string } } }).response?.data;
        yield put(bulkRestoreResourceFailure({ resource, error: responseData?.message || message }));
    }
}

function* handleBulkForceDeleteResource(action: PayloadAction<{ resource: string; ids: (string | number)[] }>) {
    const { resource, ids } = action.payload;
    try {
        yield call(api.bulkForceDelete, resource, ids);
        yield put(bulkForceDeleteResourceSuccess({ resource, ids }));
        yield call(reFetchResource, resource);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const responseData = (error as { response?: { data?: { message?: string } } }).response?.data;
        yield put(bulkForceDeleteResourceFailure({ resource, error: responseData?.message || message }));
    }
}

function* handleImportResource(action: PayloadAction<{ resource: string; formData: FormData }>) {
    const { resource, formData } = action.payload;
    try {
        yield call(api.import, resource, formData);
        yield put(importResourceSuccess({ resource }));
        yield call(reFetchResource, resource);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const responseData = (error as { response?: { data?: { message?: string } } }).response?.data;
        yield put(importResourceFailure({ resource, error: responseData?.message || message }));
    }
}

function* handleExportResource(action: PayloadAction<{ resource: string; params: Record<string, unknown> }>) {
    const { resource, params } = action.payload;
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = yield call(api.export, resource, params);

        // Handle file download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        const contentDisposition = response.headers['content-disposition'];
        let filename = 'export.xlsx';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch?.[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        yield put(exportResourceSuccess({ resource }));
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const responseData = (error as { response?: { data?: { message?: string } } }).response?.data;
        yield put(exportResourceFailure({ resource, error: responseData?.message || message }));
    }
}

export function* resourceSaga(): Generator {
    yield takeEvery(fetchResourceRequest.type, handleFetchResource);
    yield takeLatest(fetchItemRequest.type, handleFetchItem);
    yield takeLatest(createResourceRequest.type, handleCreateResource);
    yield takeLatest(updateResourceRequest.type, handleUpdateResource);
    yield takeLatest(deleteResourceRequest.type, handleDeleteResource);
    yield takeLatest(duplicateResourceRequest.type, handleDuplicateResource);
    yield takeLatest(restoreResourceRequest.type, handleRestoreResource);
    yield takeLatest(forceDeleteResourceRequest.type, handleForceDeleteResource);
    yield takeLatest(bulkDeleteResourceRequest.type, handleBulkDeleteResource);
    yield takeLatest(bulkDuplicateResourceRequest.type, handleBulkDuplicateResource);
    yield takeLatest(bulkRestoreResourceRequest.type, handleBulkRestoreResource);
    yield takeLatest(bulkForceDeleteResourceRequest.type, handleBulkForceDeleteResource);
    yield takeLatest(importResourceRequest.type, handleImportResource);
    yield takeLatest(exportResourceRequest.type, handleExportResource);
}
