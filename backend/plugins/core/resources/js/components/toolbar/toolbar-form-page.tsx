import { Save, Trash2, Copy } from "lucide-react";
import { Button } from "@core/components/ui/button";
import { cn } from "@core/lib/utils";
import { tt } from "@core/lib/i18n";

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
        </div>
    );
};

export default ToolbarFormPage;
