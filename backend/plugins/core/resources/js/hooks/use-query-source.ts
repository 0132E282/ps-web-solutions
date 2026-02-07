import { useState, useEffect, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { route } from '@core/lib/route';

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

// Simple pluralize function (matches Laravel Str::plural for common cases)
export const pluralize = (word: string): string => {
  if (word.includes('-')) {
    const parts = word.split('-');
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const pluralLastPart = pluralize(lastPart);
      return [...parts.slice(0, -1), pluralLastPart].join('-');
    }
  }

  const lower = word.toLowerCase();
  if (lower.endsWith('y') && !lower.endsWith('ay') && !lower.endsWith('ey') && !lower.endsWith('oy') && !lower.endsWith('uy')) {
    return word.slice(0, -1) + 'ies';
  }
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('z') || lower.endsWith('ch') || lower.endsWith('sh')) {
    return word + 'es';
  }
  return word + 's';
};

// Serialize nested params to query string
export const serializeNestedParams = (obj: Record<string, unknown>, prefix = ''): string[] => {
  const pairs: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;

    if (value === null || value === undefined) {
      continue;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      pairs.push(...serializeNestedParams(value as Record<string, unknown>, fullKey));
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== null && item !== undefined) {
          pairs.push(`${fullKey}[]=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      pairs.push(`${fullKey}=${encodeURIComponent(String(value))}`);
    }
  }

  return pairs;
};

// Build URL from route and params
export const buildUrl = (sourceRoute: string, params?: Record<string, unknown>): string => {
  let resolvedUrl: string;
  try {
    resolvedUrl = route(sourceRoute);
  } catch {
    resolvedUrl = sourceRoute;
  }

  if (!params) return resolvedUrl;

  const queryString = serializeNestedParams(params).join('&');
  return queryString ? `${resolvedUrl}?${queryString}` : resolvedUrl;
};

// Convert query config to source config
export const convertQueryToSource = (query: QueryConfig): SourceConfig => {
  const pluralName = pluralize(query.collection);
  const routeName = `admin.${pluralName}.index`;

  const params: Record<string, unknown> = {};

  if (query.fields) {
    params.fields = typeof query.fields === 'string' ? query.fields : query.fields.join(',');
  }

  if (query.filters && Object.keys(query.filters).length > 0) {
    params.filters = { _and: query.filters };
  }

  const detectLabelKey = (fields: string | string[] | undefined): string => {
    if (!fields) return 'id';
    const fieldArray = typeof fields === 'string' ? fields.split(',') : fields;
    if (fieldArray.includes('title')) return 'title';
    if (fieldArray.includes('name')) return 'name';
    return 'id';
  };

  return {
    route: routeName,
    params: Object.keys(params).length > 0 ? params : undefined,
    valueKey: 'id',
    labelKey: detectLabelKey(query.fields),
  };
};

// Transform API response to options array
export const transformOptions = (
  data: unknown,
  valueKey: string,
  labelKey: string
): Array<{ value: string; label: string }> => {
  if (Array.isArray(data)) {
    return data.map((item) => {
      const record = item as Record<string, unknown>;
      return {
        value: String(record[valueKey] ?? record.id ?? record.value ?? ''),
        label: String(record[labelKey] ?? record.name ?? record.label ?? ''),
      };
    });
  }

  if (data && typeof data === 'object') {
    const dataObj = data as { data?: unknown[]; items?: unknown[]; results?: unknown[] };
    const items = dataObj.data || dataObj.items || dataObj.results || [];
    return items.map((item) => {
      const record = item as Record<string, unknown>;
      return {
        value: String(record[valueKey] ?? record.id ?? record.value ?? ''),
        label: String(record[labelKey] ?? record.name ?? record.label ?? ''),
      };
    });
  }

  return [];
};

// Replace placeholders in filters: $params.id, $auth.id, $keyword
// Returns array of keys that should be removed (have unreplaced placeholders)
const replacePlaceholders = (
  obj: Record<string, unknown>,
  routeParams: Record<string, unknown> | null,
  authId: string | null,
  keyword: string | null
): string[] => {
  const keysToRemove: string[] = [];

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      const value = obj[key] as string;
      let hasUnreplaced = false;

      // Replace $params.* (e.g., $params.id, $params.category_id)
      if (value.includes('$params.')) {
        const paramMatches = value.match(/\$params\.(\w+)/g);
        if (paramMatches && routeParams) {
          let newValue = value;
          let allReplaced = true;
          paramMatches.forEach((match) => {
            const paramKey = match.replace('$params.', '');
            const paramValue = routeParams[paramKey];
            if (paramValue !== undefined && paramValue !== null) {
              const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              newValue = newValue.replace(new RegExp(escapedMatch, 'g'), String(paramValue));
            } else {
              allReplaced = false;
            }
          });
          if (allReplaced) {
            obj[key] = newValue;
          } else {
            hasUnreplaced = true;
          }
        } else {
          hasUnreplaced = true;
        }
      }

      // Replace $auth.id
      if (value.includes('$auth.id')) {
        if (authId) {
          obj[key] = value.replace(/\$auth\.id/g, authId);
        } else {
          hasUnreplaced = true;
        }
      }

      // Replace $keyword
      if (value.includes('$keyword')) {
        if (keyword) {
          obj[key] = value.replace(/\$keyword/g, keyword);
        } else {
          hasUnreplaced = true;
        }
      }

      if (hasUnreplaced) {
        keysToRemove.push(key);
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const nestedKeysToRemove = replacePlaceholders(obj[key] as Record<string, unknown>, routeParams, authId, keyword);
      // Remove nested keys with unreplaced placeholders
      nestedKeysToRemove.forEach(nestedKey => {
        delete (obj[key] as Record<string, unknown>)[nestedKey];
      });
      // If object becomes empty, mark parent key for removal
      if (Object.keys(obj[key] as Record<string, unknown>).length === 0) {
        keysToRemove.push(key);
      }
    }
  }

  return keysToRemove;
};

// Hook to fetch options from source/query config
export const useQuerySource = (
  source: SourceConfig | undefined,
  query: QueryConfig | undefined,
  keyword?: string | null
) => {
  const { props: pageProps } = usePage<{
    auth?: { user?: { id?: string | number } };
    user?: { id?: string | number };
    ziggy?: {
      route?: {
        params?: Record<string, unknown>;
      };
    };
  }>();
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get route params from ziggy route params
  const routeParams = useMemo(() => {
    return pageProps?.ziggy?.route?.params || null;
  }, [pageProps]);

  // Get authenticated user ID from props
  const authId = useMemo(() => {
    const user = pageProps?.auth?.user || pageProps?.user;
    return user?.id ? String(user.id) : null;
  }, [pageProps]);

  // Convert query to source if needed
  const resolvedSource = useMemo(() => {
    if (query) {
      return convertQueryToSource(query);
    }
    return source;
  }, [query, source]);

  // Merge params with placeholders replacement
  const mergedParams = useMemo(() => {
    if (!resolvedSource?.params) return undefined;

    const params = { ...resolvedSource.params };

    if (params.filters) {
      const filters = JSON.parse(JSON.stringify(params.filters));

      // Replace placeholders and get keys to remove
      const keysToRemove = replacePlaceholders(filters, routeParams, authId, keyword || null);

      // Remove filters with unreplaced placeholders
      keysToRemove.forEach(key => {
        delete filters[key];
      });

      // If filters._and exists, clean it up
      if (filters._and && typeof filters._and === 'object') {
        const andFilters = filters._and as Record<string, unknown>;
        const andKeysToRemove = replacePlaceholders(andFilters, routeParams, authId, keyword || null);
        andKeysToRemove.forEach(key => {
          delete andFilters[key];
        });

        // Remove _and if empty
        if (Object.keys(andFilters).length === 0) {
          delete filters._and;
        }
      }

      // Only keep filters if there are any left
      if (Object.keys(filters).length > 0) {
        params.filters = filters;
      } else {
        delete params.filters;
      }
    }

    return params;
  }, [resolvedSource, routeParams, authId, keyword]);

  // Serialize params for comparison
  const paramsKey = useMemo(() => {
    if (!mergedParams) return '';
    try {
      return JSON.stringify(mergedParams);
    } catch {
      return '';
    }
  }, [mergedParams]);

  // Fetch options
  useEffect(() => {
    if (!resolvedSource?.route) {
      return;
    }

    const abortController = new AbortController();
    setIsLoading(true);

    const url = buildUrl(resolvedSource.route, mergedParams);
    const valueKey = resolvedSource.valueKey || 'id';
    const labelKey = resolvedSource.labelKey || 'name';

    axios.get(url, { signal: abortController.signal })
      .then((response) => {
        if (!abortController.signal.aborted) {
          const transformed = transformOptions(response.data, valueKey, labelKey);
          setOptions(transformed);
        }
      })
      .catch((error) => {
        if (!abortController.signal.aborted && error.name !== 'CanceledError') {
          setOptions([]);
        }
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
      }
      });

    return () => {
      abortController.abort();
    };
  }, [resolvedSource?.route, paramsKey, resolvedSource?.valueKey, resolvedSource?.labelKey, mergedParams]);


  return { options, isLoading };
};

