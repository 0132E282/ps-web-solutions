import axiosLib from 'axios';
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/**
 * Default headers cho tất cả requests
 */
const defaultHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
};

/**
 * Tạo axios instance với config mặc định
 */
const axiosInstance: AxiosInstance = axiosLib.create({
    headers: defaultHeaders,
    withCredentials: true,
});

/**
 * Request interceptor - có thể thêm logic trước khi gửi request
 */
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Có thể thêm token, logging, etc. ở đây
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor - có thể xử lý response hoặc error
 */
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        // Có thể xử lý response ở đây
        return response;
    },
    (error: AxiosError) => {
        // Có thể xử lý error ở đây
        return Promise.reject(error);
    }
);

/**
 * Update default headers cho axios instance
 *
 * @param headers - Headers mới để merge với defaults
 */
export function updateDefaultHeaders(headers: Record<string, string>): void {
    Object.assign(defaultHeaders, headers);
    // Update headers cho instance
    Object.assign(axiosInstance.defaults.headers.common, headers);
}

/**
 * Update default config cho axios instance
 *
 * @param config - Config mới để merge với defaults
 */
export function updateDefaultConfig(config: AxiosRequestConfig): void {
    Object.assign(axiosInstance.defaults, config);
    if (config.headers) {
        Object.assign(defaultHeaders, config.headers);
        Object.assign(axiosInstance.defaults.headers.common, config.headers);
    }
}

/**
 * Export axios instance với tên axios để sử dụng trực tiếp
 */
export const axios = axiosInstance;
export default axios;

