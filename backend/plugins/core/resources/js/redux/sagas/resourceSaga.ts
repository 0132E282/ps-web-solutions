import type { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
import { axios } from '@core/lib/axios';
import i18n, { tt } from '@core/lib/i18n';
import { route } from '@core/lib/route';
import { toast } from '@core/lib/toast';
import type { ApiResponse } from '../../types/api';
import type { ResourcePagination } from '../../types/resource';
import * as actions from '../slices/resourceSlice';

// --- Types ---
type ResourceId = string | number;

interface ResourceItem {
    id: ResourceId;
    [key: string]: unknown;
}

interface CommonPayload {
    resource: string;
}

interface IdPayload extends CommonPayload {
    id: ResourceId;
    params?: Record<string, unknown>;
}

interface DataPayload extends CommonPayload {
    data: Record<string, unknown>;
}

interface IdDataPayload extends IdPayload {
    data: Record<string, unknown>;
}

interface IdsPayload extends CommonPayload {
    ids: ResourceId[];
}

interface ParamsPayload extends CommonPayload {
    params?: Record<string, unknown>;
}

interface FormDataPayload extends CommonPayload {
    formData: FormData;
}

const getLocaleParams = (): { locale: string } => ({ locale: i18n.language });

// --- API Helpers ---
const resolveUrl = (resource: string, action?: string, id?: ResourceId, params?: Record<string, unknown>): string => {
    const isNamed = resource.includes('.');
    if (isNamed) {
        const base = resource.replace(/\.index$/, '').replace(/\.?$/, '');
        const routeName = action ? `${base}.${action}` : resource;
        return route(routeName, { id, ...getLocaleParams(), ...params });
    }
    let url = `/${resource}`;
    if (id) url += `/${id}`;
    if (action && !['show', 'update', 'destroy'].includes(action)) {
        url += `/${action}`;
    }
    return url;
};

const api = {
    fetch: (res: string, params?: Record<string, unknown>) => {
        const isNamed = res.includes('.');
        const url = resolveUrl(res, undefined, undefined, isNamed ? params : undefined);
        return axios.get(url, isNamed ? undefined : { params: { ...params, ...getLocaleParams() } });
    },
    fetchOne: (res: string, id: ResourceId, params?: Record<string, unknown>) => {
        const isNamed = res.includes('.');
        const url = resolveUrl(res, 'show', id, isNamed ? params : undefined);
        return axios.get(url, isNamed ? undefined : { params: { ...params, ...getLocaleParams() } });
    },
    create: (res: string, data: Record<string, unknown>) => {
        const isNamed = res.includes('.');
        const url = isNamed ? resolveUrl(res, 'store') : `${resolveUrl(res)}/store`;
        return axios.post(url, data, isNamed ? undefined : { params: getLocaleParams() });
    },
    update: (res: string, id: ResourceId, data: Record<string, unknown>) => {
        const isNamed = res.includes('.');
        return axios.put(resolveUrl(res, 'update', id), data, isNamed ? undefined : { params: getLocaleParams() });
    },
    delete: (res: string, id: ResourceId) => {
        const isNamed = res.includes('.');
        return axios.delete(resolveUrl(res, 'destroy', id), isNamed ? undefined : { params: getLocaleParams() });
    },
    action: (res: string, id: ResourceId, act: string, method: 'post' | 'delete' = 'post') => {
        const isNamed = res.includes('.');
        return axios[method](resolveUrl(res, act, id), undefined, isNamed ? undefined : { params: getLocaleParams() });
    },
    bulk: (res: string, ids: ResourceId[], act?: string, method: 'post' | 'delete' = 'post') => {
        const isNamed = res.includes('.');
        const url = resolveUrl(res, act);
        const config = { data: { ids }, params: isNamed ? undefined : getLocaleParams() };
        return method === 'delete'
            ? axios.delete(url, config)
            : axios.post(url, { ids }, isNamed ? undefined : { params: getLocaleParams() });
    },
    import: (res: string, formData: FormData) => {
        const isNamed = res.includes('.');
        const url = resolveUrl(res, 'import');
        return axios.post(url, formData, {
            params: isNamed ? undefined : getLocaleParams(),
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    export: (res: string, params: Record<string, unknown>) => {
        const isNamed = res.includes('.');
        const url = resolveUrl(res, 'export', undefined, isNamed ? params : undefined);
        return axios.get(url, {
            params: isNamed ? undefined : { ...params, ...getLocaleParams() },
            responseType: 'blob'
        });
    }
};

// --- Saga Utilities ---
const selectLastParams = (res: string) =>
    (state: { resource: Record<string, { lastParams?: Record<string, unknown> }> }) => state.resource[res]?.lastParams;

function* reFetch(resource: string): Generator {
    const params = (yield select(selectLastParams(resource))) as Record<string, unknown> | undefined;
    yield put(actions.fetchResourceRequest({ resource, params }));
}

interface RunSagaOptions {
    msg?: string;
    refetch?: boolean;
    args?: unknown[];
}

function* runSaga<P extends CommonPayload, S>(
    action: PayloadAction<P>,
    apiFn: (...args: unknown[]) => Promise<unknown>,
    success: ActionCreatorWithPayload<S>,
    failure: ActionCreatorWithPayload<{ resource: string; error: string }>,
    options: RunSagaOptions = {}
): Generator {
    const { resource, ...payload } = action.payload;
    try {
        const apiArgs = options.args || [resource, ...Object.values(payload)];
        const resp = (yield call(apiFn as (...args: unknown[]) => unknown, ...apiArgs)) as {
            data: Record<string, unknown> & { data?: unknown; item?: unknown }
        };
        const data = resp.data?.data ?? resp.data?.item ?? resp.data;

        yield put(success({ resource, data, ...payload } as unknown as S));
        if (options.msg) toast(tt(options.msg), 'success');
        if (options.refetch) yield call(reFetch, resource);
    } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        const msg = error.response?.data?.message || error.message || 'Unknown error';
        yield put(failure({ resource, error: msg }));
        toast(msg, 'error');
    }
}

// --- Specific Handlers ---
function* handleFetch(action: PayloadAction<ParamsPayload>): Generator {
    const { resource, params } = action.payload;
    try {
        const resp = (yield call(api.fetch as (...args: unknown[]) => unknown, resource, params)) as { data: ApiResponse<ResourceItem> };
        const { data, items, meta, links } = resp.data;
        yield put(actions.fetchResourceSuccess({
            resource,
            data: (data || items) as ResourceItem[],
            pagination: (meta || links) ? (resp.data as unknown as ResourcePagination) : undefined
        }));
    } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        const msg = error.response?.data?.message || error.message || 'Unknown error';
        yield put(actions.fetchResourceFailure({ resource, error: msg }));
    }
}

function* handleExport(action: PayloadAction<ParamsPayload>): Generator {
    const { resource, params } = action.payload;
    try {
        const resp = (yield call(api.export as (...args: unknown[]) => unknown, resource, params || {})) as { data: BlobPart; headers: Record<string, string> };
        const url = window.URL.createObjectURL(new Blob([resp.data]));
        const link = document.createElement('a');
        link.href = url;
        const filename = resp.headers['content-disposition']?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]?.replace(/['"]/g, '') || 'export.xlsx';
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        yield put(actions.exportResourceSuccess({ resource }));
    } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        const msg = error.response?.data?.message || error.message || 'Unknown error';
        yield put(actions.exportResourceFailure({ resource, error: msg }));
    }
}

// --- Watcher ---
export function* resourceSaga(): Generator {
    yield takeEvery(actions.fetchResourceRequest.type, handleFetch);
    yield takeLatest(actions.fetchItemRequest.type, (a: PayloadAction<IdPayload>) =>
        runSaga(a, api.fetchOne as (...args: unknown[]) => Promise<unknown>, actions.fetchItemSuccess, actions.fetchItemFailure));

    // Mutations
    yield takeLatest(actions.createResourceRequest.type, (a: PayloadAction<DataPayload>) =>
        runSaga(a, api.create as (...args: unknown[]) => Promise<unknown>, actions.createResourceSuccess, actions.createResourceFailure, { msg: 'common.created_success', refetch: true }));
    yield takeLatest(actions.updateResourceRequest.type, (a: PayloadAction<IdDataPayload>) =>
        runSaga(a, api.update as (...args: unknown[]) => Promise<unknown>, actions.updateResourceSuccess, actions.updateResourceFailure, { msg: 'common.updated_success', refetch: true }));
    yield takeLatest(actions.deleteResourceRequest.type, (a: PayloadAction<IdPayload>) =>
        runSaga(a, api.delete as (...args: unknown[]) => Promise<unknown>, actions.deleteResourceSuccess, actions.deleteResourceFailure, { msg: 'common.deleted_success', refetch: true }));

    // Actions
    yield takeLatest(actions.duplicateResourceRequest.type, (a: PayloadAction<IdPayload>) =>
        runSaga(a, ((r: unknown, id: unknown) => api.action(r as string, id as ResourceId, 'duplicate')) as (...args: unknown[]) => Promise<unknown>, actions.duplicateResourceSuccess, actions.duplicateResourceFailure, { msg: 'common.duplicated_success', refetch: true }));
    yield takeLatest(actions.restoreResourceRequest.type, (a: PayloadAction<IdPayload>) =>
        runSaga(a, ((r: unknown, id: unknown) => api.action(r as string, id as ResourceId, 'restore')) as (...args: unknown[]) => Promise<unknown>, actions.restoreResourceSuccess, actions.restoreResourceFailure, { msg: 'common.restored_success', refetch: true }));
    yield takeLatest(actions.forceDeleteResourceRequest.type, (a: PayloadAction<IdPayload>) =>
        runSaga(a, ((r: unknown, id: unknown) => api.action(r as string, id as ResourceId, 'force-delete', 'delete')) as (...args: unknown[]) => Promise<unknown>, actions.forceDeleteResourceSuccess, actions.forceDeleteResourceFailure, { msg: 'common.force_deleted_success', refetch: true }));

    // Bulk
    yield takeLatest(actions.bulkDeleteResourceRequest.type, (a: PayloadAction<IdsPayload>) =>
        runSaga(a, ((r: unknown, ids: unknown) => api.bulk(r as string, ids as ResourceId[], undefined, 'delete')) as (...args: unknown[]) => Promise<unknown>, actions.bulkDeleteResourceSuccess, actions.bulkDeleteResourceFailure, { msg: 'common.deleted_success', refetch: true }));
    yield takeLatest(actions.bulkDuplicateResourceRequest.type, (a: PayloadAction<IdsPayload>) =>
        runSaga(a, ((r: unknown, ids: unknown) => api.bulk(r as string, ids as ResourceId[], 'duplicate')) as (...args: unknown[]) => Promise<unknown>, actions.bulkDuplicateResourceSuccess, actions.bulkDuplicateResourceFailure, { refetch: true }));
    yield takeLatest(actions.bulkRestoreResourceRequest.type, (a: PayloadAction<IdsPayload>) =>
        runSaga(a, ((r: unknown, ids: unknown) => api.bulk(r as string, ids as ResourceId[], 'restore')) as (...args: unknown[]) => Promise<unknown>, actions.bulkRestoreResourceSuccess, actions.bulkRestoreResourceFailure, { refetch: true }));
    yield takeLatest(actions.bulkForceDeleteResourceRequest.type, (a: PayloadAction<IdsPayload>) =>
        runSaga(a, ((r: unknown, ids: unknown) => api.bulk(r as string, ids as ResourceId[], 'force-delete', 'delete')) as (...args: unknown[]) => Promise<unknown>, actions.bulkForceDeleteResourceSuccess, actions.bulkForceDeleteResourceFailure, { refetch: true }));

    // Files
    yield takeLatest(actions.importResourceRequest.type, (a: PayloadAction<FormDataPayload>) =>
        runSaga(a, api.import as (...args: unknown[]) => Promise<unknown>, actions.importResourceSuccess, actions.importResourceFailure, { refetch: true }));
    yield takeLatest(actions.exportResourceRequest.type, handleExport);
}
