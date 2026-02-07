export interface ModelConfigs {
    [fieldName: string]: {
        type?: string;
        ui?: string;
        options?: Array<{ value: string; label: string }>;
        config?: Record<string, unknown>;
    };
}

export interface ViewsConfig {
    title?: string;
    description?: string;
    icon?: string;
    actions?: {
        create?: boolean | string;
        edit?: boolean | string;
        destroy?: boolean | string;
        import?: boolean | string;
        export?: boolean | string;
        duplicate?: boolean | string;
        [key: string]: unknown;
    };
    sections?: {
        main?: Array<{
            header?: {
                title?: string;
                description?: string;
            };
            fields?: Array<string | Record<string, unknown>>;
        }>;
        sidebar?: Array<{
            header?: {
                title?: string;
                description?: string;
            };
            fields?: Array<string | Record<string, unknown>>;
        }>;
    };
    fields?: Array<string | Record<string, unknown>>;
    filters?: Array<Record<string, unknown>>;
    [key: string]: unknown;
}

export interface PagePropsWithViews {
    views?: ViewsConfig;
    configs?: ModelConfigs;
    ziggy?: {
        route?: {
            name?: string;
        };
    };
    [key: string]: unknown;
}

export interface UseModuleReturn {
    current: string | null;
    view: ViewRoutes;
    views: ViewsConfig;
    configs: ModelConfigs;
    getFieldOptions: (
        field: Record<string, unknown>,
        fieldName: string
    ) => Array<{ value: string; label: string }> | undefined;
    getFilterOptions: (
        filter: Record<string, unknown>,
        filterKey: string
    ) => Array<{ value: string; label: string }> | undefined;
    crudRoutes: CrudRoutes;
}

export interface CrudRoutes {
    index: string | null;
    create: string | null;
    store: string | null;
    show: string | null;
    edit: string | null;
    update: string | null;
    destroy: string | null;
    import: string | null;
    export: string | null;
    importTemplate: string | null;
    duplicate: string | null;
    trash: string | null;
    restore: string | null;
    forceDelete: string | null;
}

export interface ViewRoutes {
    show: string | null;
    edit: string | null;
}
