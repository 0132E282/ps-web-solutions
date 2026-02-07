// Global registry for table instances
// Allows HeaderToolbarTable to automatically find table instances without refs

import type { Table } from "@tanstack/react-table";

type TableInstance<TData = unknown> = Table<TData>;
type RefreshFunction = (page: number, limit: number, search?: string) => Promise<void>;

interface TableMetadata {
    table: TableInstance;
    refreshData?: RefreshFunction;
    effectiveUseApi?: boolean;
}

class TableRegistry {
    private tables: Map<string, TableMetadata> = new Map();
    private routeToTableId: Map<string, string> = new Map();

    register<TData = unknown>(
        tableId: string, 
        table: TableInstance<TData>, 
        routeName?: string,
        metadata?: { refreshData?: RefreshFunction; effectiveUseApi?: boolean }
    ): void {
        this.tables.set(tableId, {
            table: table as TableInstance,
            refreshData: metadata?.refreshData,
            effectiveUseApi: metadata?.effectiveUseApi,
        });
        if (routeName) {
            this.routeToTableId.set(routeName, tableId);
        }
    }

    unregister(tableId: string): void {
        this.tables.delete(tableId);
        // Remove from route mapping
        for (const [route, id] of this.routeToTableId.entries()) {
            if (id === tableId) {
                this.routeToTableId.delete(route);
            }
        }
    }

    get<TData = unknown>(tableId?: string): TableInstance<TData> | null {
        if (tableId) {
            const metadata = this.tables.get(tableId);
            return (metadata?.table as TableInstance<TData> | undefined) || null;
        }
        // If no ID provided, get the most recently registered table
        const tablesArray = Array.from(this.tables.values());
        const lastMetadata = tablesArray[tablesArray.length - 1];
        return (lastMetadata?.table as TableInstance<TData> | undefined) || null;
    }

    getByRoute<TData = unknown>(routeName: string): TableInstance<TData> | null {
        const tableId = this.routeToTableId.get(routeName);
        if (tableId) {
            const metadata = this.tables.get(tableId);
            return (metadata?.table as TableInstance<TData> | undefined) || null;
        }
        return null;
    }

    getRefreshFunction(routeName?: string): RefreshFunction | null {
        if (routeName) {
            const tableId = this.routeToTableId.get(routeName);
            if (tableId) {
                const metadata = this.tables.get(tableId);
                return metadata?.refreshData || null;
            }
        }
        // Get from most recent table
        const tablesArray = Array.from(this.tables.values());
        const lastMetadata = tablesArray[tablesArray.length - 1];
        return lastMetadata?.refreshData || null;
    }

    isUsingApi(routeName?: string): boolean {
        if (routeName) {
            const tableId = this.routeToTableId.get(routeName);
            if (tableId) {
                const metadata = this.tables.get(tableId);
                return metadata?.effectiveUseApi || false;
            }
        }
        // Get from most recent table
        const tablesArray = Array.from(this.tables.values());
        const lastMetadata = tablesArray[tablesArray.length - 1];
        return lastMetadata?.effectiveUseApi || false;
    }

    getAll<TData = unknown>(): TableInstance<TData>[] {
        return Array.from(this.tables.values()).map(m => m.table) as TableInstance<TData>[];
    }
}

export const tableRegistry = new TableRegistry();

