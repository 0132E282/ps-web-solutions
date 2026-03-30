import { ColumnDef } from "@tanstack/react-table";
import { processColumns } from "@core/utils/table-columns";

/**
 * Get the column width as a CSS property with automatic 'px' suffix for numbers
 */
export const getWidthStyle = (meta?: { width?: string | number }): React.CSSProperties => {
    if (!meta?.width) return {};

    const widthValue = typeof meta.width === "number"
        ? `${meta.width}px`
        : meta.width;

    return {
        width: widthValue,
        minWidth: widthValue,
        maxWidth: widthValue,
    };
};

/**
 * Merge user-provided columns with base columns and handle routing/resource logic
 */
export const mergeColumns = <TData extends Record<string, unknown>>(
    columns: ColumnDef<TData>[],
    baseColumns: ColumnDef<TData>[],
    resourceName?: string | null,
    routeName?: string | null
): ColumnDef<TData>[] => {
    if (!baseColumns?.length) return processColumns(columns, resourceName, routeName);

    const idIndex = baseColumns.findIndex(
        (col) => {
            const colAny = col as unknown as { accessorKey?: string; id?: string };
            return colAny.accessorKey === "id" || col.id === "id";
        }
    );

    if (idIndex === -1) {
        const selectColumn = baseColumns.find((col) => col.id === "select");
        const actionsColumn = baseColumns.find((col) => col.id === "actions");
        const otherBaseColumns = baseColumns.filter(
            (col) => col.id !== "select" && col.id !== "actions"
        );

        return processColumns([
            ...(selectColumn ? [selectColumn] : []),
            ...otherBaseColumns,
            ...columns,
            ...(actionsColumn ? [actionsColumn] : []),
        ], resourceName, routeName);
    }

    return processColumns([
        ...baseColumns.slice(0, idIndex + 1),
        ...columns,
        ...baseColumns.slice(idIndex + 1),
    ], resourceName, routeName);
};
