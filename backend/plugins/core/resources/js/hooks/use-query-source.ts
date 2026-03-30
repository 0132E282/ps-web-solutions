import { route } from '@core/lib/route';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

export interface SourceConfig {
  route: string;
  params?: Record<string, unknown>;
  valueKey?: string;
  labelKey?: string;
}

export interface QueryConfig {
  collection: string;
  filters?: Record<string, Record<string, unknown>>;
  fields?: string | string[];
}

type Option = { value: string; label: string };
type AnyConfig = string | SourceConfig | QueryConfig;
type Obj = Record<string, unknown>;

export const pluralize = (word: string): string => {
  if (word.includes('-')) {
    const parts = word.split('-');
    const last = parts.at(-1)!;
    return [...parts.slice(0, -1), pluralize(last)].join('-');
  }
  const w = word.toLowerCase();
  const SINGULAR_S = ['bus', 'gas', 'glass', 'dress', 'kiss', 'class', 'status'];
  if (w.endsWith('ies')) return word;
  if (w.endsWith('s')) return SINGULAR_S.includes(w) ? word + 'es' : word;
  if (w.endsWith('y') && !/[aeiouy]y$/.test(w)) return word.slice(0, -1) + 'ies';
  if (/[xz]$|ch$|sh$/.test(w)) return word + 'es';
  return word + 's';
};

export const serializeNestedParams = (obj: Obj, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const k = prefix ? `${prefix}[${key}]` : key;
    if (value == null) return [];
    if (Array.isArray(value)) return value.filter((v) => v != null).map((v) => `${k}[]=${encodeURIComponent(String(v))}`);
    if (typeof value === 'object') return serializeNestedParams(value as Obj, k);
    return [`${k}=${encodeURIComponent(String(value))}`];
  });

export const buildUrl = (sourceRoute: string, params?: Obj): string => {
  let url: string;
  try { url = route(sourceRoute); } catch { url = sourceRoute; }
  if (!params) return url;
  const qs = serializeNestedParams(params).join('&');
  return qs ? `${url}?${qs}` : url;
};

export const convertQueryToSource = (config: AnyConfig): SourceConfig => {
  if (typeof config !== 'string' && 'route' in config) return config as SourceConfig;

  const q = typeof config === 'string' ? { collection: config } : (config as QueryConfig);
  const arr = q.fields ? (Array.isArray(q.fields) ? q.fields : q.fields.split(',')) : [];
  const labelKey = ['title', 'name', 'label'].find((k) => arr.includes(k)) ?? arr[0] ?? 'name';
  const params: Obj = {};
  if (arr.length) params.fields = arr.join(',');
  if (q.filters && Object.keys(q.filters).length) params.filters = { _and: q.filters };

  return {
    route: `admin.${pluralize(q.collection).replace(/_/g, '-')}.index`,
    params: Object.keys(params).length ? params : undefined,
    valueKey: 'id',
    labelKey,
  };
};

const extractLabel = (value: unknown, locale?: string | null): string => {
  if (value == null) return '';
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Obj;
    const v = locale && obj[locale] ? obj[locale] : Object.values(obj)[0];
    return v != null ? String(v) : '';
  }
  return String(value);
};

export const transformOptions = (data: unknown, valueKey: string, labelKey: string, locale?: string | null): Option[] => {
  const toOption = (item: unknown): Option => {
    const r = item as Obj;
    return {
      value: String(r[valueKey] ?? r.id ?? r.value ?? ''),
      label: extractLabel(r[labelKey] ?? r.name ?? r.label ?? '', locale),
    };
  };
  if (Array.isArray(data)) return data.map(toOption);
  if (data && typeof data === 'object') {
    const d = data as { data?: unknown[]; items?: unknown[]; results?: unknown[] };
    return (d.data ?? d.items ?? d.results ?? []).map(toOption);
  }
  return [];
};

const resolvePlaceholders = (obj: Obj, routeParams: Obj | null, authId: string | null, keyword: string | null): string[] => {
  const stale: string[] = [];
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      let s = val, bad = false;
      for (const m of s.match(/\$params\.(\w+)/g) ?? []) {
        const p = routeParams?.[m.slice(8)];
        p != null ? (s = s.replaceAll(m, String(p))) : (bad = true);
      }
      if (s.includes('$auth.id')) authId ? (s = s.replace(/\$auth\.id/g, authId)) : (bad = true);
      if (s.includes('$keyword')) keyword ? (s = s.replace(/\$keyword/g, keyword)) : (bad = true);
      bad ? stale.push(key) : (obj[key] = s);
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      const nested = val as Obj;
      resolvePlaceholders(nested, routeParams, authId, keyword).forEach((k) => delete nested[k]);
      if (!Object.keys(nested).length) stale.push(key);
    }
  }
  return stale;
};

const cleanFilters = (raw: Obj, routeParams: Obj | null, authId: string | null, keyword: string | null): Obj | undefined => {
  const f = JSON.parse(JSON.stringify(raw)) as Obj;
  resolvePlaceholders(f, routeParams, authId, keyword).forEach((k) => delete f[k]);
  if (f._and && typeof f._and === 'object') {
    const and = f._and as Obj;
    resolvePlaceholders(and, routeParams, authId, keyword).forEach((k) => delete and[k]);
    if (!Object.keys(and).length) delete f._and;
  }
  return Object.keys(f).length ? f : undefined;
};

export const useQuerySource = (config: AnyConfig | undefined, keyword?: string | null) => {
  const { props } = usePage<{
    auth?: { user?: { id?: string | number } };
    user?: { id?: string | number };
    ziggy?: { route?: { params?: Obj } };
  }>();

  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const routeParams = useMemo(() => props?.ziggy?.route?.params ?? null, [props]);
  const authId = useMemo(() => { const u = props?.auth?.user ?? props?.user; return u?.id ? String(u.id) : null; }, [props]);
  const locale = useMemo(() => (props as Obj)?.locale as string ?? 'vi', [props]);
  const resolvedSource = useMemo(() => (config ? convertQueryToSource(config) : undefined), [config]);

  const mergedParams = useMemo(() => {
    if (!resolvedSource?.params) return undefined;
    const p = { ...resolvedSource.params };
    if (p.filters) {
      const cleaned = cleanFilters(p.filters as Obj, routeParams, authId, keyword ?? null);
      cleaned ? (p.filters = cleaned) : delete p.filters;
    }
    return p;
  }, [resolvedSource, routeParams, authId, keyword]);

  const paramsKey = useMemo(() => { try { return mergedParams ? JSON.stringify(mergedParams) : ''; } catch { return ''; } }, [mergedParams]);

  useEffect(() => {
    if (!resolvedSource?.route) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => setIsLoading(true), 0);
    const url = buildUrl(resolvedSource.route, mergedParams);
    const valueKey = resolvedSource.valueKey ?? 'id';
    const labelKey = resolvedSource.labelKey ?? 'name';

    axios
      .get(url, { signal: ctrl.signal })
      .then(({ data }) => { if (!ctrl.signal.aborted) setOptions(transformOptions(data, valueKey, labelKey, locale)); })
      .catch((err) => { if (!ctrl.signal.aborted && err.name !== 'CanceledError') setOptions([]); })
      .finally(() => { if (!ctrl.signal.aborted) setIsLoading(false); });

    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [resolvedSource?.route, resolvedSource?.valueKey, resolvedSource?.labelKey, paramsKey, mergedParams, locale]);

  return { options, isLoading };
};
