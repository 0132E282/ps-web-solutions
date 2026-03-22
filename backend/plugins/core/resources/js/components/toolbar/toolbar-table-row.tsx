import { Button } from "@core/components/ui/button";
import { Trash2, Copy, RefreshCcw, XCircle, MoreVertical } from "lucide-react";
import { ConfirmDialog } from "@core/components/dialogs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@core/components/ui/dropdown-menu";
import React, { useMemo, useState } from "react";
import { getCurrentRouteName } from "@core/lib/route";
import { tt } from "@core/lib/i18n";
import { useModule } from "@core/hooks/use-module";
import { useDispatch } from "react-redux";
import {
    duplicateResourceRequest,
    restoreResourceRequest,
    forceDeleteResourceRequest,
    deleteResourceRequest
} from "../../redux/slices/resourceSlice";
import { usePage } from "@inertiajs/react";

interface ToolbarDataTableRowProps {
    row: Record<string, unknown> & { id: number | string };
}

type ActionType = 'delete' | 'duplicate' | 'restore' | 'forceDelete';

interface ActionDefinition {
    id: ActionType;
    icon: React.ComponentType<{ className?: string }>;
    labelKey: string;
    defaultLabel: string;
    confirmTitleKey?: string;
    confirmTitleDefault: string;
    confirmDescriptionKey?: string;
    confirmDescriptionDefault: string;
    variant?: 'default' | 'destructive';
    isTrashAction: boolean;
    viewKey: string;
}

const ACTIONS: ActionDefinition[] = [
    {
        id: 'duplicate',
        icon: Copy,
        labelKey: 'common.duplicate',
        defaultLabel: 'Nhân bản',
        confirmTitleKey: 'common.confirm_duplicate',
        confirmTitleDefault: 'Xác nhận nhân bản',
        confirmDescriptionKey: 'common.confirm_duplicate_message',
        confirmDescriptionDefault: 'Bạn có chắc chắn muốn nhân bản bản ghi này không?',
        variant: 'default',
        isTrashAction: false,
        viewKey: 'duplicate'
    },
    {
        id: 'restore',
        icon: RefreshCcw,
        labelKey: 'common.restore',
        defaultLabel: 'Khôi phục',
        confirmTitleKey: 'common.confirm_restore',
        confirmTitleDefault: 'Xác nhận khôi phục',
        confirmDescriptionKey: 'common.confirm_restore_message',
        confirmDescriptionDefault: 'Bạn có chắc chắn muốn khôi phục bản ghi này không?',
        variant: 'default',
        isTrashAction: true,
        viewKey: 'restore'
    },
    {
        id: 'forceDelete',
        icon: XCircle,
        labelKey: 'common.force_delete',
        defaultLabel: 'Xóa vĩnh viễn',
        confirmTitleKey: 'common.confirm_force_delete',
        confirmTitleDefault: 'Xác nhận xóa vĩnh viễn',
        confirmDescriptionKey: 'common.confirm_force_delete_message',
        confirmDescriptionDefault: 'Hành động này sẽ xóa vĩnh viễn bản ghi và KHÔNG THỂ khôi phục.',
        variant: 'destructive',
        isTrashAction: true,
        viewKey: 'force-delete'
    },
    {
        id: 'delete',
        icon: Trash2,
        labelKey: 'common.delete',
        defaultLabel: 'Xóa',
        confirmTitleDefault: 'Xác nhận xóa',
        confirmDescriptionDefault: 'Bạn có chắc chắn muốn xóa bản ghi này không? Hành động này có thể được khôi phục từ thùng rác.',
        variant: 'destructive',
        isTrashAction: false,
        viewKey: 'delete'
    }
];

const ToolbarDataTableRow = ({ row }: ToolbarDataTableRowProps) => {
    const dispatch = useDispatch();
    const { actionRoutes, views } = useModule();
    const [confirmAction, setConfirmAction] = useState<ActionType | null>(null);
    const { props } = usePage() as any;

    const currentRouteName = props.ziggy?.route?.name || getCurrentRouteName();
    const isTrash = currentRouteName?.endsWith('.trash');
    const resourceName = useMemo(() => currentRouteName || actionRoutes.index || actionRoutes.show || '', [currentRouteName, actionRoutes]);

    const hydratedActions = useMemo(() => {
        return ACTIONS.reduce((acc, action) => {
            acc[action.id] = {
                ...action,
                title: (action.confirmTitleKey ? tt(action.confirmTitleKey) : null) || action.confirmTitleDefault,
                description: (action.confirmDescriptionKey ? tt(action.confirmDescriptionKey) : null) || action.confirmDescriptionDefault,
                label: tt(action.labelKey) || action.defaultLabel,
                handler: () => {
                    const params = { resource: resourceName, id: row.id };
                    if (action.id === 'duplicate') dispatch(duplicateResourceRequest(params));
                    if (action.id === 'restore') dispatch(restoreResourceRequest(params));
                    if (action.id === 'forceDelete') dispatch(forceDeleteResourceRequest(params));
                    if (action.id === 'delete') dispatch(deleteResourceRequest(params));
                }
            };
            return acc;
        }, {} as Record<ActionType, any>);
    }, [resourceName, row.id, dispatch]);

    const menuItems = useMemo(() => {
        return ACTIONS
            .filter(action => action.isTrashAction === isTrash)
            .filter(action => views?.actions?.[action.viewKey] !== false)
            .map(action => hydratedActions[action.id]);
    }, [isTrash, views, hydratedActions]);

    const activeConfig = confirmAction ? hydratedActions[confirmAction] : null;

    return <>
        <div className="flex items-center justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground focus-visible:ring-0">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                    {menuItems.map(item => (
                        <DropdownMenuItem
                            key={item.id}
                            onClick={() => setConfirmAction(item.id)}
                            className={item.variant === 'destructive' ? "text-destructive focus:text-destructive" : ""}
                        >
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.label}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <ConfirmDialog
            open={!!confirmAction}
            onOpenChange={open => !open && setConfirmAction(null)}
            onConfirm={() => { activeConfig?.handler(); setConfirmAction(null); }}
            title={activeConfig?.title ?? ''}
            description={activeConfig?.description ?? ''}
            confirmLabel={activeConfig?.label ?? ''}
            variant={activeConfig?.variant || 'default'}
            descriptionClassName={confirmAction === 'forceDelete' ? 'text-destructive' : undefined}
        />
    </>;
};

export default ToolbarDataTableRow;
