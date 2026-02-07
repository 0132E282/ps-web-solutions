import * as React from "react";
import {
    Filter,
    Plus,
    Trash2,
} from "lucide-react";
import { Button } from "@core/components/ui/button";
import { Input } from "@core/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from "@core/components/ui/dialog";
import { Badge } from "@core/components/ui/badge";
import { cn } from "@core/lib/utils";
import { tt } from "@core/lib/i18n";
import { Separator } from "@core/components/ui/separator";
import { ControllerRenderProps, FieldValues } from "react-hook-form";

// Project specific form inputs
import InputNumber from "@core/components/form/input/inputNumber";
import InputSelect from "@core/components/form/input/inputSelect";
import { InputMultiSelect } from "@core/components/form/input/inputMultiSelect";
import InputDateRange from "@core/components/form/input/InputDateRange";

// --- Types ---

export type FilterValue = string | string[] | number | number[] | boolean | null;

export interface AdvancedFilterCondition {
    id: string;
    field: string;
    operator: string;
    value: FilterValue;
    type?: 'text' | 'number' | 'date' | 'select' | 'multi-select';
}

export interface AdvancedFilterField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multi-select';
    options?: Array<{ label: string; value: string | number | boolean }>;
    collection?: {
        route?: string;
        url?: string;
        labelKey?: string;
        valueKey?: string;
    };
}

export interface AdvancedFilterProps {
    fields: AdvancedFilterField[];
    conditions: AdvancedFilterCondition[];
    onConditionsChange: (conditions: AdvancedFilterCondition[]) => void;
    onApply: () => void;
    onClear: () => void;
    className?: string;
}

// --- Constants ---

const SELECT_OPERATORS = [
    { value: "_eq", label: "Là" },
    { value: "_ne", label: "Không là" },
    { value: "_in", label: "Nằm trong" },
    { value: "_not_in", label: "Không nằm trong" },
    { value: "_is_null", label: "Trống" },
    { value: "_is_not_null", label: "Không trống" },
];

const OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
    text: [
        { value: "_eq", label: "Bằng" },
        { value: "_ne", label: "Không bằng" },
        { value: "_like", label: "Chứa" },
        { value: "_not_like", label: "Không chứa" },
        { value: "_is_null", label: "Trống" },
        { value: "_is_not_null", label: "Không trống" },
    ],
    number: [
        { value: "_eq", label: "=" },
        { value: "_ne", label: "!=" },
        { value: "_gt", label: ">" },
        { value: "_gte", label: ">=" },
        { value: "_lt", label: "<" },
        { value: "_lte", label: "<=" },
        { value: "_between", label: "Trong khoảng" },
        { value: "_is_null", label: "Trống" },
    ],
    date: [
        { value: "_eq", label: "Ngày này" },
        { value: "_gt", label: "Sau ngày" },
        { value: "_lt", label: "Trước ngày" },
        { value: "_between", label: "Trong khoảng" },
    ],
    select: SELECT_OPERATORS,
    "multi-select": SELECT_OPERATORS,
};

const CollectionValueInput = ({
    field,
    collection,
    type,
    name
}: {
    field: ControllerRenderProps<FieldValues, string>,
    collection: NonNullable<AdvancedFilterField['collection']>,
    type: 'select' | 'multi-select',
    name: string
}) => {
    const [options, setOptions] = React.useState<{ label: string; value: string }[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let isMounted = true;
        const fetchOptions = async () => {
            setLoading(true);
            try {
                const url = collection.url || (collection.route ? `/${collection.route}` : "");
                if (!url) {
                    setLoading(false);
                    return;
                }

                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to fetch options");
                const data = await response.json();

                const items = Array.isArray(data) ? data : (data.data || data.items || []);
                const mappedOptions = items.map((item: Record<string, unknown>) => ({
                    label: String(item[collection.labelKey || 'name'] || item[collection.labelKey || 'title'] || item.id),
                    value: String(item[collection.valueKey || 'id'] || item.id),
                }));

                if (isMounted) {
                    setOptions(mappedOptions);
                    setLoading(false);
                }
            } catch (err: unknown) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Error fetching options");
                    setLoading(false);
                }
            }
        };

        fetchOptions();
        return () => { isMounted = false; };
    }, [collection.url, collection.route, collection.labelKey, collection.valueKey]);

    const inputClassName = "h-9 w-full bg-background border border-input focus:ring-1 focus:ring-primary rounded-lg px-3 text-sm transition-all hover:border-primary/40 focus:border-primary shadow-none focus-visible:ring-1 focus-visible:ring-primary outline-none";

    if (loading) return <div className={cn(inputClassName, "flex items-center text-muted-foreground")}>Đang tải...</div>;
    if (error) return <div className={cn(inputClassName, "text-destructive text-xs flex items-center")}>Lỗi tải dữ liệu</div>;

    if (type === 'multi-select') {
        return <InputMultiSelect field={field} options={options} className={inputClassName} />;
    }

    return <InputSelect field={field} options={options} className={inputClassName} name={name} />;
};



function getOperatorOptions(condition: AdvancedFilterCondition, fields: AdvancedFilterField[]): { value: string; label: string }[] {
    const field = fields.find(f => f.key === condition.field);
    if (field && (field.collection || (field.options && field.options.length > 0))) {
        return SELECT_OPERATORS;
    }
    if (field) {
        return OPERATORS_BY_TYPE[field.type] || [];
    }
    return SELECT_OPERATORS;
}

function renderValueInput(
    condition: AdvancedFilterCondition,
    fields: AdvancedFilterField[],
    updateCondition: (id: string, updates: Partial<AdvancedFilterCondition>) => void
) {
    const field = fields.find((f) => f.key === condition.field);
    if (!field) return null;
    if (condition.operator === "_is_null" || condition.operator === "_is_not_null") return null;

    const mockField = {
        name: condition.field,
        value: condition.value || "",
        onChange: (val: unknown) => {
            const value = (val && typeof val === 'object' && 'target' in val)
                ? (val as React.ChangeEvent<HTMLInputElement>).target.value
                : val;
            updateCondition(condition.id, { value: value as FilterValue });
        },
        onBlur: () => {},
        ref: () => {},
    };
    const rHFField = mockField as unknown as ControllerRenderProps<FieldValues, string>;
    const inputClassName = "h-9 w-full bg-background border border-input focus:ring-1 focus:ring-primary rounded-lg px-3 text-sm transition-all hover:border-primary/40 focus:border-primary shadow-none focus-visible:ring-1 focus-visible:ring-primary outline-none";

    // Select/collection logic: _eq/_ne = select, _in/_not_in = multi-select
    if (field.collection) {
        const isMulti = condition.operator === '_in' || condition.operator === '_not_in';
        return (
            <CollectionValueInput
                field={rHFField}
                collection={field.collection}
                type={isMulti ? 'multi-select' : 'select'}
                name={condition.field}
            />
        );
    }
    if (field.options && field.options.length > 0) {
        const isMulti = condition.operator === '_in' || condition.operator === '_not_in';
        if (isMulti) {
            return (
                <InputMultiSelect
                    field={rHFField}
                    options={field.options as { value: string; label: string }[]}
                    className={inputClassName}
                />
            );
        }
        return (
            <InputSelect
                field={rHFField}
                options={field.options as { value: string; label: string }[]}
                className={inputClassName}
                name={condition.field}
            />
        );
    }
    // Date
    if (condition.type === "date") {
        return (
            <div className="flex-1 min-w-0 font-normal">
                <InputDateRange
                    field={rHFField}
                    name={condition.field}
                    className={inputClassName}
                    showPresets={condition.operator === "_between"}
                />
            </div>
        );
    }
    // Number
    if (condition.type === "number") {
        return (
            <InputNumber
                field={rHFField}
                name={condition.field}
                className={inputClassName}
            />
        );
    }
    // Text
    return (
        <Input
            className={inputClassName}
            placeholder="Nhập giá trị..."
            value={typeof condition.value === 'string' || typeof condition.value === 'number' ? String(condition.value) : ""}
            onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
        />
    );
}

// --- Components ---

const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
    fields,
    conditions,
    onConditionsChange,
    onApply,
    onClear,
    className,
}) => {
    const [open, setOpen] = React.useState(false);

    const addCondition = () => {
        if (fields.length === 0) return;

        const firstField = fields[0]!;
        const newCondition: AdvancedFilterCondition = {
            id: Math.random().toString(36).substring(2, 9),
            field: firstField.key,
            operator: OPERATORS_BY_TYPE[firstField.type]?.[0]?.value || "_eq",
            value: "",
            type: firstField.type,
        };
        onConditionsChange([...conditions, newCondition]);
    };

    const updateCondition = (id: string, updates: Partial<AdvancedFilterCondition>) => {
        onConditionsChange(
            conditions.map((c) => {
                if (c.id !== id) return c;

              const updated = { ...c, ...updates };

                if (updates.field) {
                  const field = fields.find((f) => f.key === updates.field);
                    if (field) {
                        updated.type = field.type;
                        updated.operator = OPERATORS_BY_TYPE[field.type]?.[0]?.value || "_eq";
                        updated.value = "";
                    }
                }

                return updated;
            })
        );
    };

    const removeCondition = (id: string) => {
        onConditionsChange(conditions.filter((c) => c.id !== id));
    };

    const handleClear = () => {
        onClear();
    };

    const handleApply = () => {
        onApply();
        setOpen(false);
    };





    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-9 px-3 border border-border hover:border-primary/50 transition-colors shadow-none",
                        conditions.length > 0 && "bg-primary/5 border-primary/30 text-primary",
                        className
                    )}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    <span>{tt("common.advanced_filter") === "common.advanced_filter" ? "Lọc nâng cao" : tt("common.advanced_filter")}</span>
                    {conditions.length > 0 && (
                        <div className="ml-2 flex items-center gap-1">
                            <Separator orientation="vertical" className="h-4 bg-primary/20" />
                            <Badge variant="secondary" className="px-1.5 h-5 min-w-[20px] justify-center bg-primary text-primary-foreground border-none shadow-none">
                                {conditions.length}
                            </Badge>
                        </div>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden bg-background border border-border rounded-xl shadow-none">
                <div className="p-5 space-y-5">
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Filter className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold">
                                    {tt("common.advanced_filter") === "common.advanced_filter" ? "Bộ lọc nâng cao" : tt("common.advanced_filter")}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Thiết lập đa điều kiện linh hoạt để lọc dữ liệu chính xác
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Separator className="bg-border/50" />

                    <div className="space-y-3 max-h-[400px] overflow-y-auto px-0.5 custom-scrollbar">
                        {conditions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed border-border">
                                <div className="h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center mb-3">
                                    <Filter className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">Chưa có điều kiện lọc nào</p>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 mt-1 text-primary text-xs shadow-none"
                                    onClick={addCondition}
                                >
                                    Thêm điều kiện ngay
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3 py-2">
                                {conditions.map((condition, index) => (
                                    <div key={condition.id} className="group relative animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="flex items-center gap-2">
                                            {/* Conjunction label */}
                                            <div className="w-[50px] flex items-center justify-center shrink-0">
                                                {index === 0 ? (
                                                    <span className="text-[10px] font-bold text-muted-foreground/50 tracking-wider uppercase bg-muted px-2 py-0.5 rounded border border-border">LỌC</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-primary tracking-wider uppercase bg-primary/10 px-2 py-0.5 rounded border border-primary/20">VÀ</span>
                                                )}
                                            </div>

                                            {/* Filter Row Controls */}
                                            <div className="flex-1 flex items-center gap-2">
                                                {/* Field Select */}
                                                <div className="w-[180px] border border-input rounded-lg hover:border-primary/40 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all bg-background overflow-hidden relative group/input">
                                                    <InputSelect
                                                        field={{
                                                            name: "field",
                                                            value: condition.field,
                                                            onChange: (val: unknown) => updateCondition(condition.id, { field: val as string }),
                                                            onBlur: () => {},
                                                            ref: () => {},
                                                        } as unknown as ControllerRenderProps<FieldValues, string>}
                                                        options={fields.map(f => ({ value: f.key, label: f.label }))}
                                                        className="h-9 border-none bg-transparent focus:ring-0 text-sm font-medium shadow-none w-full"
                                                        name="field"
                                                    />
                                                </div>

                                                {/* Operator Select - always show for all types, auto-detect select/multi-select if options/collection */}
                                                <div className="w-[140px] border border-input rounded-lg hover:border-primary/40 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all bg-background overflow-hidden relative group/input">
                                                    <InputSelect
                                                        field={{
                                                            name: "operator",
                                                            value: condition.operator,
                                                            onChange: (val: unknown) => updateCondition(condition.id, { operator: val as string }),
                                                            onBlur: () => {},
                                                            ref: () => {},
                                                        } as unknown as ControllerRenderProps<FieldValues, string>}
                                                        options={getOperatorOptions(condition, fields)}
                                                        className="h-9 border-none bg-transparent focus:ring-0 text-sm text-muted-foreground shadow-none w-full"
                                                        name="operator"
                                                    />
                                                </div>

                                                {/* Value Input */}
                                                <div className="flex-1 min-w-0">
                                                    {renderValueInput(condition, fields, updateCondition)}
                                                </div>

                                                {/* Delete Action */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border-transparent hover:border-destructive/20"
                                                    onClick={() => removeCondition(condition.id)}
                                                    title="Xóa điều kiện"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all rounded-lg font-medium text-xs shadow-none"
                        onClick={addCondition}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm điều kiện mới
                    </Button>
                </div>

                <DialogFooter className="bg-muted/20 p-4 flex flex-row items-center justify-between border-t border-border gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        disabled={conditions.length === 0}
                        className="text-muted-foreground hover:text-destructive font-medium text-xs shadow-none"
                    >
                        Xóa tất cả
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="h-9 px-4 rounded-lg border-border hover:bg-background text-xs shadow-none">
                            Hủy
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleApply}
                            className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-xs font-semibold shadow-none"
                        >
                            Áp dụng bộ lọc
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AdvancedFilter;
