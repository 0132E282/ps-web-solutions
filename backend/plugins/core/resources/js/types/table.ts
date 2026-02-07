import type { RowData } from "@tanstack/react-table";
import * as React from "react";

/**
 * Badge configuration for badge-type columns
 */
export interface BadgeConfig {
    trueLabel?: string;
    falseLabel?: string;
    trueVariant?: "default" | "secondary" | "destructive" | "outline";
    falseVariant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
}

/**
 * Image configuration for image-type columns
 */
export interface ImageConfig {
    size?: "sm" | "md" | "lg";
    fallback?: string;
    className?: string;
}

/**
 * Number formatting configuration for number-type columns
 */
export interface NumberConfig {
    format?: "decimal" | "currency" | "percent";
    locale?: string;
    currency?: string;
    decimals?: number;
}

/**
 * Checkbox configuration for checkbox-type columns
 */
export interface CheckboxConfig {
    onCheckedChange?: (checked: boolean, row: Record<string, unknown>) => void;
    disabled?: boolean | ((row: Record<string, unknown>) => boolean);
}

/**
 * Select option for select-type columns
 */
export interface SelectOption {
    label: string;
    value: string | number;
}

/**
 * Column types supported by the DataTable
 */
export type ColumnType = "badge" | "text" | "date" | "image" | "checkbox" | "select" | "number" | "custom";

/**
 * Extended ColumnMeta for TanStack Table
 * Contains all custom metadata for column configuration
 */
declare module "@tanstack/react-table" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData = unknown, TValue = unknown> {
        /** Type of the column cell renderer */
        type?: ColumnType;
        /** Enable sorting on this column */
        sort?: boolean;
        /** Alternative accessor key for sorting */
        sortAccessorKey?: string;
        /** Column width (CSS value) */
        width?: string | number;
        /** Allow multiple values (for badge/select types) */
        multiple?: boolean;
        /** Icon to display in header */
        icon?: React.ReactNode;
        /** Icon position relative to header text */
        iconPosition?: "left" | "right";
        /** Enable link wrapping (true = auto route, string = custom route) */
        link?: boolean | string;
        /** ID key for link generation */
        linkIdKey?: string;
        /** Mark as primary column (auto-link enabled) */
        primary?: boolean;
        /** Allow column to be hidden */
        enableHiding?: boolean;
        /** Options for select-type columns */
        options?: SelectOption[];
        /** Badge configuration */
        badgeConfig?: BadgeConfig;
        /** Image configuration */
        imageConfig?: ImageConfig;
        /** Number formatting configuration */
        numberConfig?: NumberConfig;
        /** Checkbox configuration */
        checkboxConfig?: CheckboxConfig;
    }
}

/**
 * Admin interface for base columns
 * @deprecated Consider using generic type instead
 */
export interface Admin {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    roles: string[];
    created_at: string;
    updated_at: string;
}
