import { Save, Trash2, Copy, List, Network } from "lucide-react";
import { Button } from "@core/components/ui/button";
import { cn } from "@core/lib/utils";
import { tt } from "@core/lib/i18n";
import { ToggleGroup, ToggleGroupItem } from "@core/components/ui/toggle-group";

interface ToolbarFormPageProps {
    className?: string;
    isEdit?: boolean;
    onSave?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onCancel?: () => void;
    showDelete?: boolean;
    showDuplicate?: boolean;
    disabled?: boolean;
    layouts?: string[];
    viewMode?: string;
    onViewModeChange?: (mode: string) => void;
}

const ToolbarFormPage = ({
    className = "",
    isEdit: isEditProp,
    onSave: onSaveProp,
    onDelete: onDeleteProp,
    onDuplicate: onDuplicateProp,
    showDelete = true,
    showDuplicate = true,

    disabled = false,
    layouts = [],
    viewMode = "table",
    onViewModeChange,
}: ToolbarFormPageProps) => {
    const isEdit = isEditProp;
    const onSave = onSaveProp;
    const onDelete = onDeleteProp;
    const onDuplicate = onDuplicateProp;
    // const onCancel removed

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {isEdit && showDuplicate && onDuplicate && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onDuplicate}
                    className="gap-2"
                    disabled={disabled}
                >
                    <Copy className="h-4 w-4" />
                    {tt('common.duplicate') || 'Nhân bản'}
                </Button>
            )}
            {isEdit && showDelete && onDelete && (
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={onDelete}
                    className="gap-2 text-white"
                    disabled={disabled}
                >
                    <Trash2 className="h-4 w-4" />
                    {tt('common.delete') || 'Xóa'}
                </Button>
            )}
            {onSave && (
                <Button
                    type="button"
                    size="sm"
                    onClick={onSave}
                    className="gap-2"
                    disabled={disabled}
                >
                    <Save className="h-4 w-4" />
                    {isEdit ? (tt('common.save_changes') || 'Lưu thay đổi') : (tt('common.create') || 'Tạo mới')}
                </Button>
            )}
            {layouts && layouts.length > 1 && (
                <div className="mr-auto">
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(val) => {
                            if (val && onViewModeChange) onViewModeChange(val);
                        }}
                        className="bg-muted/50 p-1 rounded-lg border shadow-sm h-9"
                    >
                        {layouts.includes('table') && (
                            <ToggleGroupItem
                                value="table"
                                aria-label="Table View"
                                size="sm"
                                className="h-7 w-8 px-0 data-[state=on]:bg-primary! data-[state=on]:text-primary-foreground! data-[state=on]:shadow-sm rounded-md transition-all"
                            >
                                <List className="h-4 w-4" />
                            </ToggleGroupItem>
                        )}
                        {layouts.includes('tree') && (
                            <ToggleGroupItem
                                value="tree"
                                aria-label="Tree View"
                                size="sm"
                                className="h-7 w-8 px-0 data-[state=on]:bg-primary! data-[state=on]:text-primary-foreground! data-[state=on]:shadow-sm rounded-md transition-all"
                            >
                                <Network className="h-4 w-4" />
                            </ToggleGroupItem>
                        )}
                    </ToggleGroup>
                </div>
            )}
        </div>
    );
};

export default ToolbarFormPage;
