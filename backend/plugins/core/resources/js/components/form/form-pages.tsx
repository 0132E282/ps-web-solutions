"use client";
import { useForm as useReactHookForm, UseFormReturn, SubmitHandler, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useImperativeHandle, useCallback, useMemo } from "react";
import { usePage, router } from "@inertiajs/react";
import { route, getCurrentRouteName } from "@core/lib/route";
import { tt } from "@core/lib/i18n";
import { toast } from "@core/lib/toast";
import { useAppSelector, useAppDispatch, useAPI, setSubmitting, setDeleting } from "@core/redux";
import type { AxiosError } from "axios";
import { Form } from "./form";
import type {
  FormProps,
  FormRef,
  FormData
} from "@core/types/forms";
import type { BasePageProps } from "@core/types/common";
import ToolbarFormPage from "../toolbar/toolbar-form-page";

// Re-export types for convenience
export type {
  FormProps,
  FormRef,
  FormData,
  FormSectionProps,
  FormActionsProps,
  FormField,
  FormSectionConfig
} from "@core/types/forms";

/**
 * Parse nested field name và set value
 */
function setNestedField(
  reactHookForm: UseFormReturn<FormData>,
  name: string,
  value: unknown
): boolean {
  if (!name.includes('.')) return false;
  const [fieldName, ...pathParts] = name.split('.');
  if (!fieldName || !pathParts.length) return false;

  try {
    const finalKey = pathParts.pop();
    if (!finalKey) return false;
    const currentValue = (reactHookForm.getValues(fieldName) || {}) as Record<string, unknown>;
    const target = pathParts.reduce<Record<string, unknown>>(
      (obj, part) => {
        obj[part] = obj[part] || {};
        return obj;
      },
      { ...currentValue }
    );
    target[finalKey] = value;
    reactHookForm.setValue(fieldName, { ...currentValue, ...target } as never);
    return true;
  } catch (error) {
    console.warn(`Failed to set nested field value for ${name}:`, error);
    return false;
  }
}

export const FormPages = forwardRef<FormRef, FormProps>(
  (
    {
      onSubmit,
      onError,
      children,
      defaultValues,
      className,
      formSchema,
      title,
      showHeader = true,
    },
    ref
  ) => {
    const { props } = usePage<BasePageProps>();
    const reactHookForm = useReactHookForm<FormData>({
      resolver: formSchema ? zodResolver(formSchema as never) : undefined,
      defaultValues: defaultValues as Partial<FormData>,
      shouldFocusError: false,
    });

    // Memoize route parsing
    const { currentRouteName, prefix, resourceName, isShowPage } = useMemo(() => {
      const routeName = props.ziggy?.route?.name || getCurrentRouteName() || '';
      const parts = routeName.split('.');
      const routePrefix = parts[0] === 'admin' ? 'admin' : '';
      const routeResourceName = parts[0] === 'admin' && parts.length > 1 ? parts[1] : parts[0] || '';
      const showPage = routeName.endsWith('.show');

      return {
        currentRouteName: routeName,
        prefix: routePrefix,
        resourceName: routeResourceName,
        isShowPage: showPage,
      };
    }, [props.ziggy?.route?.name]);

    // Get item data and id together
    const { itemId, itemData } = useMemo(() => {
      const item = (props as BasePageProps & { item?: Record<string, unknown> & { id?: string | number } })?.item;
      const defaultData = defaultValues && typeof defaultValues === 'object'
        ? defaultValues as Record<string, unknown>
        : null;

      const data = defaultData || item || null;
      const id = defaultData?.id
        ? String(defaultData.id)
        : item?.id
          ? String(item.id)
          : null;

      return { itemId: id, itemData: data };
    }, [defaultValues, props]);

    const routeTitle = useMemo(() => {
      if (!currentRouteName) return '';
      if (title) return title;

      // For show page, try to get title or name from item data
      if (isShowPage && itemData) {
        const itemTitle = itemData.title || itemData.name;
        if (itemTitle && typeof itemTitle === 'string') {
          return itemTitle;
        }
      }

      const routeTitleKey = `route.${currentRouteName}`;
      const translated = tt(routeTitleKey);
      if (translated !== routeTitleKey) return translated;

      if (prefix && resourceName) {
        return tt(`route.${resourceName}`) || resourceName;
      }
      return currentRouteName;
    }, [currentRouteName, title, isShowPage, itemData, prefix, resourceName]);

    const isEdit = !!itemId;

    // Memoize routes
    const routes = useMemo(() => {
      if (!resourceName) {
        return { store: '', update: '', destroy: '', index: '' };
      }
      const baseRoute = prefix ? `${prefix}.${resourceName}` : resourceName;
      return {
        store: `${baseRoute}.store`,
        update: isEdit && itemId ? `${baseRoute}.edit` : '',
        destroy: isEdit && itemId ? `${baseRoute}.destroy` : '',
        index: `${baseRoute}.index`,
      };
    }, [resourceName, prefix, isEdit, itemId]);

    // Redux hooks
    const dispatch = useAppDispatch();
    const { isSubmitting, isDeleting } = useAppSelector(state => state.module);
    const api = useAPI();

    const handleBack = useCallback(() => {
      try {
        if (routes.index) router.get(route(routes.index));
        else window.history.back();
      } catch {
        window.history.back();
      }
    }, [routes.index]);

    const handleArrayField = useCallback((name: string, value: unknown) => setNestedField(reactHookForm, name, value), [reactHookForm]);
    const setValue = useCallback((name: string, value: unknown, options?: { shouldValidate?: boolean; shouldDirty?: boolean; shouldTouch?: boolean }) => {
      if (!handleArrayField(name, value)) {
        reactHookForm.setValue(name as never, value as never, options);
      }
    }, [reactHookForm, handleArrayField]);
    const getValues = useCallback((name?: string) => name ? reactHookForm.getValues(name as never) : reactHookForm.getValues(), [reactHookForm]);
    const reset = useCallback((values?: Partial<FormData>) => reactHookForm.reset(values as FormData), [reactHookForm]);

    const handleError = useCallback((errors: FieldErrors<FormData> | Record<string, string | string[]>) => {
      (document.activeElement as HTMLElement)?.blur?.();
      const formattedErrors: Record<string, string | string[] | undefined> = {};

      Object.keys(errors).forEach(key => {
        const error = errors[key];
        if (error) {
          const message = typeof error === 'object' && 'message' in error
            ? error.message || String(error)
            : Array.isArray(error) ? error[0] : error;
          formattedErrors[key] = message as string;
          reactHookForm.setError(key as never, { type: 'server', message: message as string });
        }
      });

      onError?.(formattedErrors);
    }, [onError, reactHookForm]);

    const handleDelete = useCallback(async () => {
      if (!itemId || !routes.destroy || isDeleting) return;
      if (!confirm(tt('common.confirm_delete') || 'Bạn có chắc chắn muốn xóa?')) return;

      dispatch(setDeleting(true));
      try {
        // Convert route name to URL with id parameter
        const destroyUrl = route(routes.destroy, { id: itemId });
        await api.delete({
          url: destroyUrl,
        });
        toast(tt('common.deleted_success') || 'Xóa thành công!', 'success');
        router.get(route(routes.index));
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        toast(axiosError.response?.data?.message || tt('common.delete_error') || 'Có lỗi xảy ra khi xóa!', 'error');
      } finally {
        dispatch(setDeleting(false));
      }
    }, [itemId, routes, isDeleting, dispatch, api]);

    const handleDuplicate = useCallback(() => {
      if (!itemId || !resourceName) return;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...dataToClone } = reactHookForm.getValues();
      reactHookForm.reset(dataToClone as Partial<FormData>);
      toast(tt('common.duplicated_success') || 'Đã sao chép dữ liệu!', 'info');
      try {
        const createRoute = prefix ? `${prefix}.${resourceName}.create` : `${resourceName}.create`;
        router.get(route(createRoute));
      } catch {
        toast(tt('common.error') || 'Có lỗi xảy ra!', 'error');
      }
    }, [itemId, resourceName, reactHookForm, prefix]);

    /**
     * Kiểm tra xem data có chứa File objects không
     */
    const hasFileObjects = useCallback((obj: unknown): boolean => {
      if (obj instanceof File) return true;
      if (obj instanceof FileList) return true;
      if (Array.isArray(obj)) return obj.some(item => hasFileObjects(item));
      if (obj && typeof obj === 'object') {
        return Object.values(obj).some(value => hasFileObjects(value));
      }
      return false;
    }, []);

    /**
     * Chuyển đổi data thành FormData nếu có File objects
     */
    const convertToFormData = useCallback((data: FormData): FormData | globalThis.FormData => {
      if (!hasFileObjects(data)) return data;

      const formData = new globalThis.FormData();

      const appendValue = (key: string, value: unknown, prefix = '') => {
        const fullKey = prefix ? `${prefix}[${key}]` : key;

        if (value instanceof File) {
          formData.append(fullKey, value);
        } else if (value instanceof FileList) {
          Array.from(value).forEach((file, index) => {
            formData.append(`${fullKey}[${index}]`, file);
          });
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            appendValue(String(index), item, fullKey);
          });
        } else if (value && typeof value === 'object' && !(value instanceof Date)) {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            appendValue(nestedKey, nestedValue, fullKey);
          });
        } else if (value !== null && value !== undefined) {
          formData.append(fullKey, String(value));
        }
      };

      Object.entries(data).forEach(([key, value]) => {
        appendValue(key, value);
      });

      return formData;
    }, [hasFileObjects]);

    const handleAutoSubmit = useCallback(async (data: FormData) => {
      if (!currentRouteName || !resourceName) {
        onSubmit?.(data);
        return;
      }

      if (isSubmitting) return;
      dispatch(setSubmitting(true));

      try {
        const isUpdate = isEdit && itemId && routes.update;
        const payload = convertToFormData(data);

        if (isUpdate) {
          // Convert route name to URL with id parameter
          const updateUrl = route(routes.update, { id: itemId });
          await api.update({
            url: updateUrl,
            data: payload as Record<string, unknown>,
          });
          toast(tt('common.updated_success') || 'Cập nhật thành công!', 'success');

          // Reload page to get fresh data for header (title)
          router.reload({ only: ['item'] });
        } else if (routes.store) {
          // Convert route name to URL
          const storeUrl = route(routes.store);
          await api.create({
            url: storeUrl,
            data: payload as Record<string, unknown>,
          });
          toast(tt('common.created_success') || 'Tạo mới thành công!', 'success');
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ errors?: Record<string, string | string[]>; message?: string }>;
        const hasErrors = !!axiosError.response && !!axiosError.response.data && !!axiosError.response.data.errors;
        if (hasErrors) {
          handleError(axiosError.response!.data!.errors!);
        }
        toast(
          (axiosError.response && axiosError.response.data && axiosError.response.data.message) ||
          tt(isEdit ? 'common.update_error' : 'common.create_error') ||
          'Có lỗi xảy ra!',
          'error'
        );
        if (!hasErrors) onSubmit?.(data);
      } finally {
        dispatch(setSubmitting(false));
      }
    }, [currentRouteName, resourceName, isEdit, itemId, routes, onSubmit, handleError, isSubmitting, convertToFormData, dispatch, api]);

    useImperativeHandle(ref, () => ({
      setValue,
      getValues,
      reset,
      form: reactHookForm,
      handleArrayField,
      handleDelete,
      handleDuplicate,
      isEdit,
      itemId,
    }), [setValue, getValues, reset, reactHookForm, handleArrayField, handleDelete, handleDuplicate, isEdit, itemId]);

    const submitHandler = useCallback(() => {
      return reactHookForm.handleSubmit(
        onSubmit ? (onSubmit as SubmitHandler<FormData>) : handleAutoSubmit,
        handleError
      );
    }, [reactHookForm, onSubmit, handleError, handleAutoSubmit]);

    const handleSave = useCallback(() => submitHandler()(), [submitHandler]);

    return (
      <Form form={reactHookForm} onSubmit={submitHandler} className={className} title={title} currentRouteName={currentRouteName} routeTitle={routeTitle} onBack={handleBack}>
        {showHeader && (
          <div className="flex items-center gap-4 mb-6 max-w-full">
            {(title || routeTitle) && (
              <h1
                className="text-2xl font-bold truncate whitespace-nowrap max-w-[65%]"
                title={title || routeTitle}
              >
                {title || routeTitle}
              </h1>
            )}
            <ToolbarFormPage className="ml-auto" isEdit={isEdit} onSave={handleSave} onDelete={handleDelete} onDuplicate={handleDuplicate} onCancel={handleBack} />
          </div>
        )}
        {children}
      </Form>
    );
  }
);

FormPages.displayName = "FormPages";
