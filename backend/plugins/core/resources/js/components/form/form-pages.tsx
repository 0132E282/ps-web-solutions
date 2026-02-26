"use client";

import { tt } from "@core/lib/i18n";
import { route, getCurrentRouteName } from "@core/lib/route";
import { toast } from "@core/lib/toast";
import { useAppSelector, useAppDispatch, useAPI, setSubmitting, setDeleting } from "@core/redux";

import type { BasePageProps } from "@core/types/common";
import type { FormProps, FormRef, FormData } from "@core/types/forms";

import { zodResolver } from "@hookform/resolvers/zod";
import { usePage, router } from "@inertiajs/react";
import { isAxiosError } from "axios";
import { forwardRef, useImperativeHandle, useCallback, useMemo } from "react";
import { useForm as useReactHookForm, type UseFormReturn, type SubmitHandler, type FieldErrors, type SetValueConfig } from "react-hook-form";

import ToolbarFormPage from "../toolbar/toolbar-form-page";
import { Form } from "./form";

export type { FormProps, FormRef, FormData, FormSectionProps, FormActionsProps, FormField, FormSectionConfig } from "@core/types/forms";

// --- Helpers ---

function setNestedField(reactHookForm: UseFormReturn<FormData>, name: string, value: unknown): boolean {
  if (!name.includes('.')) return false;
  const [fieldName, ...pathParts] = name.split('.');
  if (!fieldName || !pathParts.length) return false;

  try {
    const finalKey = pathParts.pop();
    if (!finalKey) return false;
    const currentValue = (reactHookForm.getValues(fieldName) || {}) as Record<string, unknown>;
    const target = pathParts.reduce<Record<string, unknown>>((obj, part) => {
      obj[part] = obj[part] || {};
      return obj;
    }, { ...currentValue });
    target[finalKey] = value;
    reactHookForm.setValue(fieldName, { ...currentValue, ...target } as never);
    return true;
  } catch (error) {
    console.warn(`Failed to set nested field value for ${name}:`, error);
    return false;
  }
}

function hasFileObjects(obj: unknown): boolean {
  if (obj instanceof File || obj instanceof FileList) return true;
  if (Array.isArray(obj)) return obj.some(hasFileObjects);
  if (obj && typeof obj === 'object') return Object.values(obj).some(hasFileObjects);
  return false;
}

function convertToFormData(data: FormData): FormData | globalThis.FormData {
  if (!hasFileObjects(data)) return data;
  const formData = new globalThis.FormData();
  const appendValue = (key: string, value: unknown, prefix = '') => {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value instanceof File) formData.append(fullKey, value);
    else if (value instanceof FileList) Array.from(value).forEach((f, i) => formData.append(`${fullKey}[${i}]`, f));
    else if (Array.isArray(value)) value.forEach((item, i) => appendValue(String(i), item, fullKey));
    else if (value && typeof value === 'object' && !(value instanceof Date)) Object.entries(value).forEach(([k, v]) => appendValue(k, v, fullKey));
    else if (value != null) formData.append(fullKey, String(value));
  };
  Object.entries(data).forEach(([key, value]) => appendValue(key, value));
  return formData;
}

// --- Hooks ---

function useFormRouteInfo() {
  const { props } = usePage<BasePageProps>();
  const routeName = props.ziggy?.route?.name || getCurrentRouteName() || '';

  return useMemo(() => {
    const parts = routeName.split('.');
    const isPrefixAdmin = parts[0] === 'admin';
    const prefix = isPrefixAdmin ? 'admin' : '';
    // If admin.posts.index -> resource is posts. If posts.index -> resource is posts.
    const resourceName = isPrefixAdmin && parts.length > 1 ? parts[1] : parts[0] || '';

    return {
      currentRouteName: routeName,
      prefix,
      resourceName,
      isShowPage: routeName.endsWith('.show'),
    };
  }, [routeName]);
}

function useFormItemInfo(defaultValues?: unknown) {
  const { props } = usePage<BasePageProps & { item?: Record<string, unknown> & { id?: string | number } }>();
  return useMemo(() => {
    const defaultData = (defaultValues && typeof defaultValues === 'object') ? defaultValues as Record<string, unknown> : {};
    const item = props.item;
    // Prioritize item from props (Edit mode), merge with defaultValues (Create mode/Defaults)
    const itemData = item ? { ...defaultData, ...item } : (Object.keys(defaultData).length > 0 ? defaultData : null);
    const itemId = item?.id ? String(item.id) : (defaultData?.id ? String(defaultData.id) : null);

    return { itemId, itemData };
  }, [defaultValues, props.item]);
}

// --- Component ---

export const FormPages = forwardRef<FormRef, FormProps>(({
  onSubmit, onError, children, defaultValues, className, formSchema, title, showHeader = true,
}, ref) => {
  const { currentRouteName, prefix, resourceName, isShowPage } = useFormRouteInfo();
  const { itemId, itemData } = useFormItemInfo(defaultValues);
  const isEdit = !!itemId;

  const reactHookForm = useReactHookForm<FormData>({
    resolver: formSchema ? zodResolver(formSchema as never) : undefined,
    defaultValues: (defaultValues || {}) as Partial<FormData>,
    values: (itemData || undefined) as Partial<FormData> | undefined,
    shouldFocusError: false,
  });

  // Compute Routes
  const routes = useMemo(() => {
    if (!resourceName) return { store: '', update: '', destroy: '', index: '' };
    const base = prefix ? `${prefix}.${resourceName}` : resourceName;
    return {
      store: `${base}.store`,
      update: isEdit ? `${base}.edit` : '',
      destroy: isEdit ? `${base}.destroy` : '',
      index: `${base}.index`,
    };
  }, [resourceName, prefix, isEdit]);

  // Compute Page Title
  const routeTitle = useMemo(() => {
    if (!currentRouteName) return '';
    if (title) return title;

    if ((isShowPage || isEdit) && itemData) {
      const itemTitle = itemData.title || itemData.name;
      if (typeof itemTitle === 'string' && itemTitle) return itemTitle;
    }

    const key = `route.${currentRouteName}`;
    const translated = tt(key);
    if (translated !== key) return translated;

    return (prefix && resourceName) ? (tt(`route.${resourceName}`) || resourceName) : currentRouteName;
  }, [currentRouteName, title, isShowPage, isEdit, itemData, prefix, resourceName]);

  const dispatch = useAppDispatch();
  const { isSubmitting, isDeleting } = useAppSelector(state => state.module);
  const api = useAPI();

  const handleBack = useCallback(() => {
    if (routes.index) {
        try { router.get(route(routes.index)); } catch { window.history.back(); }
    } else {
        window.history.back();
    }
  }, [routes.index]);

  const handleArrayField = useCallback((name: string, value: unknown) => setNestedField(reactHookForm, name, value), [reactHookForm]);

  const setValue = useCallback((name: string, value: unknown, options?: SetValueConfig) => {
    if (!handleArrayField(name, value)) reactHookForm.setValue(name as never, value as never, options);
  }, [reactHookForm, handleArrayField]);

  const getValues = useCallback((name?: string) => name ? reactHookForm.getValues(name as never) : reactHookForm.getValues(), [reactHookForm]);
  const reset = useCallback((val?: Partial<FormData>) => reactHookForm.reset(val as FormData), [reactHookForm]);

  const handleError = useCallback((errors: FieldErrors<FormData> | Record<string, unknown>) => {
    (document.activeElement as HTMLElement)?.blur?.();
    const formatted: Record<string, string> = {};
    Object.keys(errors).forEach(key => {
      const err = errors[key as keyof typeof errors];
      if (err) {
        let msg = '';
        if (typeof err === 'object' && err !== null && 'message' in err) {
             msg = String((err as { message: unknown }).message);
        } else if (Array.isArray(err)) {
             msg = String(err[0]);
        } else {
             msg = String(err);
        }

        formatted[key] = msg;
        reactHookForm.setError(key as never, { type: 'server', message: msg });
      }
    });
    onError?.(formatted);
  }, [onError, reactHookForm]);

  const handleDelete = useCallback(async () => {
    if (!itemId || !routes.destroy || isDeleting) return;
    if (!confirm(tt('common.confirm_delete') || 'Are you sure?')) return;

    dispatch(setDeleting(true));
    try {
      await api.delete({ url: route(routes.destroy, { id: itemId }) });
      toast(tt('common.deleted_success') || 'Deleted successfully!', 'success');
      router.get(route(routes.index));
    } catch (error: unknown) {
      let message = tt('common.delete_error') || 'Delete failed!';
      if (isAxiosError(error) && error.response?.data?.message) {
          message = String(error.response.data.message);
      }
      toast(message, 'error');
    } finally {
      dispatch(setDeleting(false));
    }
  }, [itemId, routes, isDeleting, dispatch, api]);

  const handleDuplicate = useCallback(() => {
    if (!itemId || !resourceName) return;
    const cloneData = { ...reactHookForm.getValues() } as Record<string, unknown>;
    delete cloneData.id;
    reactHookForm.reset(cloneData as Partial<FormData>);
    toast(tt('common.duplicated_success') || 'Data duplicated!', 'info');
    try {
        const createRoute = prefix ? `${prefix}.${resourceName}.create` : `${resourceName}.create`;
        router.get(route(createRoute));
    } catch { toast(tt('common.error') || 'Error!', 'error'); }
  }, [itemId, resourceName, reactHookForm, prefix]);

  const handleAutoSubmit = useCallback(async (data: FormData) => {
    if (!currentRouteName || !resourceName) {
      onSubmit?.(data);
      return;
    }
    if (isSubmitting) return;
    dispatch(setSubmitting(true));

    try {
      const payload = convertToFormData(data) as Record<string, unknown>;
      if (isEdit && itemId && routes.update) {
        await api.update({ url: route(routes.update, { id: itemId }), data: payload });
        toast(tt('common.updated_success') || 'Updated successfully!', 'success');
        router.reload({ only: ['item'] });
      } else if (routes.store) {
        await api.create({ url: route(routes.store), data: payload });
        toast(tt('common.created_success') || 'Created successfully!', 'success');
      }
    } catch (error: unknown) {
        let message = tt(isEdit ? 'common.update_error' : 'common.create_error') || 'Error occurred!';
        let errors: Record<string, unknown> | undefined;

        if (isAxiosError(error)) {
            const data = error.response?.data as { errors?: Record<string, unknown>; message?: string } | undefined;
            if (data?.errors) {
                errors = data.errors;
            }
            if (data?.message) {
                message = data.message;
            }
        }

        if (errors) handleError(errors);
        toast(message, 'error');
        if (!errors) onSubmit?.(data);
    } finally {
        dispatch(setSubmitting(false));
    }
  }, [currentRouteName, resourceName, isEdit, itemId, routes, onSubmit, handleError, isSubmitting, dispatch, api]);

  useImperativeHandle(ref, () => ({
    setValue, getValues, reset, form: reactHookForm, handleArrayField, handleDelete, handleDuplicate, isEdit, itemId,
  }), [setValue, getValues, reset, reactHookForm, handleArrayField, handleDelete, handleDuplicate, isEdit, itemId]);

  const submitHandler = useCallback((e?: React.BaseSyntheticEvent) => reactHookForm.handleSubmit(onSubmit ? (onSubmit as SubmitHandler<FormData>) : handleAutoSubmit, handleError)(e), [reactHookForm, onSubmit, handleError, handleAutoSubmit]);
  const handleSave = useCallback(() => { submitHandler(); }, [submitHandler]);

  return (
    <Form form={reactHookForm} onSubmit={submitHandler} className={className} title={title} currentRouteName={currentRouteName} routeTitle={routeTitle} onBack={handleBack}>
      {showHeader && (
        <div className="flex items-center gap-4 mb-6 max-w-full">
          {(title || routeTitle) && (
            <h1 className="text-2xl font-bold truncate whitespace-nowrap max-w-[65%]" title={title || routeTitle}>
              {title || routeTitle}
            </h1>
          )}
          <ToolbarFormPage className="ml-auto" isEdit={isEdit} onSave={handleSave} onDelete={handleDelete} onDuplicate={handleDuplicate} onCancel={handleBack} />
        </div>
      )}
      {children}
    </Form>
  );
});

FormPages.displayName = "FormPages";
