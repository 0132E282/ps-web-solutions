import { memo, useState, useMemo, useCallback } from "react";
import { usePage, router } from "@inertiajs/react";
import { Plus, Key, Edit, Search, Loader2, Trash2, Save } from "lucide-react";

import { FormPages } from "@core/components/form";
import { Field } from "@core/components/form/field";
import { Button } from "@core/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@core/components/ui/card";
import { Checkbox } from "@core/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { Input } from "@core/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@core/components/ui/table";
import AppLayout from "@core/layouts/app-layout";
import { route } from "@core/lib/route";
import { toast } from "@core/lib/toast";

import type { FormData } from "@core/types/forms";
import type { MouseEvent } from "react";

// ============================================================================
// Types
// ============================================================================

interface Permission {
    id: number;
    name: string;
    group: string;
    description: string;
}

interface ApplicationKey {
    id: number;
    name: string;
    permissions: Permission[];
    last_used_at?: string;
    user?: { id: number; name: string };
}

interface PageProps {
    permissions: Record<string, Permission[]>;
    applicationKeys: ApplicationKey[];
    [key: string]: unknown;
}

// ============================================================================
// Utilities
// ============================================================================

const formatPermissionName = (name: string): string => {
    return name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
};

const filterPermissions = (
    permissions: Record<string, Permission[]>,
    searchTerm: string
): Record<string, Permission[]> => {
    if (!searchTerm.trim()) return permissions;
    const searchLower = searchTerm.toLowerCase();
    return Object.entries(permissions).reduce((acc, [groupName, groupPermissions]) => {
        const filteredGroup = groupPermissions.filter((p) => {
            return p.name.toLowerCase().includes(searchLower) ||
                formatPermissionName(p.name).toLowerCase().includes(searchLower);
        });
        if (filteredGroup.length > 0) acc[groupName] = filteredGroup;
        return acc;
    }, {} as Record<string, Permission[]>);
};

// ============================================================================
// Components
// ============================================================================

const KeyCard = memo<{
    appKey: ApplicationKey;
    isSelected: boolean;
    onSelect: (key: ApplicationKey) => void;
    onEdit: (key: ApplicationKey) => void;
}>(({ appKey, isSelected, onSelect, onEdit }) => {
    const handleClick = useCallback(() => onSelect(appKey), [onSelect, appKey]);
    const handleEdit = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onEdit(appKey);
    }, [onEdit, appKey]);

    return (
        <div
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
            }`}
            onClick={handleClick}
        >
            <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div>
                    <span className="font-medium">{appKey.name}</span>
                    <span className="text-sm ml-2 text-muted-foreground">
                        {appKey.permissions.length} quyền
                    </span>
                </div>
            </div>
            {isSelected && (
                <Button size="sm" variant="ghost" onClick={handleEdit}>
                    <Edit className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
});
KeyCard.displayName = 'KeyCard';

const PermissionGroup = memo<{
    groupName: string;
    groupPermissions: Permission[];
    originalGroupPermissions: Permission[];
    checkedPermissions: Set<number>;
    onPermissionToggle: (id: number) => void;
    onGroupToggle: (permissions: Permission[], checkAll: boolean) => void;
}>(({ groupName, groupPermissions, originalGroupPermissions, checkedPermissions, onPermissionToggle, onGroupToggle }) => {
    const isFullyChecked = useMemo(() =>
        originalGroupPermissions.length > 0 &&
        originalGroupPermissions.every(p => checkedPermissions.has(p.id)),
        [originalGroupPermissions, checkedPermissions]
    );
    const handleGroupToggle = useCallback(() =>
        onGroupToggle(originalGroupPermissions, !isFullyChecked),
        [onGroupToggle, originalGroupPermissions, isFullyChecked]
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between px-4">
                    <CardTitle className="text-lg">{groupName}</CardTitle>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Chọn tất cả</span>
                        <Checkbox checked={isFullyChecked} onCheckedChange={handleGroupToggle} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Tên</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead className="w-[50px]">Chọn</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupPermissions.map((permission) => (
                            <TableRow key={permission.id}>
                                <TableCell className="font-mono text-sm">{permission.name}</TableCell>
                                <TableCell>{formatPermissionName(permission.name)}</TableCell>
                                <TableCell>{permission.description ?? ''}</TableCell>
                                <TableCell>
                                    <Checkbox
                                        checked={checkedPermissions.has(permission.id)}
                                        onCheckedChange={() => onPermissionToggle(permission.id)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
});
PermissionGroup.displayName = 'PermissionGroup';

const KeyDialog = memo<{
    isOpen: boolean;
    editingKey: ApplicationKey | null;
    onClose: () => void;
    onSave: (data: FormData) => void;
    isLoading?: boolean;
}>(({ isOpen, editingKey, onClose, onSave, isLoading = false }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingKey ? 'Cập nhật khóa API' : 'Thêm khóa API mới'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <FormPages
                    onSubmit={onSave}
                    showHeader={false}
                    defaultValues={{ name: editingKey?.name || "" }}
                    className="space-y-4"
                >
                    <Field
                        name="name"
                        label="Tên khóa API"
                        placeholder="Nhập tên khóa API..."
                        type="text"
                    />
                    <div className="flex justify-end space-x-2 mt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Hủy
                        </Button>
                        <Button type="submit" className="cursor-pointer" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editingKey ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            {editingKey ? 'Cập nhật' : 'Tạo khóa API'}
                        </Button>
                    </div>
                </FormPages>
            </div>
        </DialogContent>
    </Dialog>
));
KeyDialog.displayName = 'KeyDialog';

const DeleteConfirmationDialog = memo<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    keyName: string;
}>(({ isOpen, onClose, onConfirm, keyName }) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Xác nhận xóa khóa API</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Bạn có chắc chắn muốn xóa khóa API <strong>"{keyName}"</strong> không?
                </p>
                <p className="text-sm text-muted-foreground">
                    Hành động này không thể hoàn tác.
                </p>
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={onClose}>Hủy</Button>
                    <Button variant="destructive" onClick={onConfirm}>Xóa khóa API</Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
));
DeleteConfirmationDialog.displayName = 'DeleteConfirmationDialog';

// ============================================================================
// Main Component
// ============================================================================

const Index = () => {
    const { permissions, applicationKeys } = usePage<PageProps>().props;

    const [checkedPermissions, setCheckedPermissions] = useState<Set<number>>(
        () => new Set(applicationKeys[0]?.permissions.map(p => p.id) ?? [])
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedKey, setSelectedKey] = useState<ApplicationKey | null>(applicationKeys[0] || null);
    const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<ApplicationKey | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const filteredPermissions = useMemo(() =>
        filterPermissions(permissions, searchTerm),
        [permissions, searchTerm]
    );

    const syncPermissionsWithKey = useCallback((key: ApplicationKey | null) => {
        setCheckedPermissions(key ? new Set(key.permissions.map(p => p.id)) : new Set());
    }, []);

    const handleKeySelect = useCallback((key: ApplicationKey) => {
        setSelectedKey(key);
        syncPermissionsWithKey(key);
    }, [syncPermissionsWithKey]);

    const handlePermissionToggle = useCallback((permissionId: number) => {
        setCheckedPermissions(prev => {
            const next = new Set(prev);
            next.has(permissionId) ? next.delete(permissionId) : next.add(permissionId);
            return next;
        });
    }, []);

    const handleGroupToggle = useCallback((groupPermissions: Permission[], checkAll: boolean) => {
        setCheckedPermissions(prev => {
            const next = new Set(prev);
            groupPermissions.forEach(p => checkAll ? next.add(p.id) : next.delete(p.id));
            return next;
        });
    }, []);

    const isGroupFullyChecked = useCallback((groupName: string) => {
        const original = permissions[groupName] || [];
        return original.length > 0 && original.every(p => checkedPermissions.has(p.id));
    }, [permissions, checkedPermissions]);

    const savePermissions = useCallback(() => {
        if (!selectedKey) return;
        setIsSavingPermissions(true);
        router.put(
            route('admin.settings.application-keys.permissions', { id: selectedKey.id }),
            { permissions: Array.from(checkedPermissions) },
            {
                onSuccess: () => { toast('Lưu quyền thành công!', 'success'); router.reload(); },
                onError: () => toast('Có lỗi xảy ra khi lưu quyền.', 'error'),
                onFinish: () => setIsSavingPermissions(false),
            }
        );
    }, [selectedKey, checkedPermissions]);

    const openKeyDialog = useCallback((key: ApplicationKey | null = null) => {
        setEditingKey(key);
        setIsKeyDialogOpen(true);
    }, []);

    const closeKeyDialog = useCallback(() => {
        setIsKeyDialogOpen(false);
        setEditingKey(null);
    }, []);

    const saveKey = useCallback((data: FormData) => {
        setIsLoading(true);
        const keyData = { name: data.name as string };
        if (editingKey) {
            router.put(route('admin.settings.application-keys.update', { id: editingKey.id }), keyData, {
                onSuccess: () => { toast('Cập nhật khóa API thành công!', 'success'); closeKeyDialog(); },
                onError: () => toast('Có lỗi xảy ra khi cập nhật khóa API.', 'error'),
                onFinish: () => setIsLoading(false),
            });
        } else {
            router.post(route('admin.settings.application-keys.store'), keyData, {
                onSuccess: () => { toast('Tạo khóa API thành công!', 'success'); closeKeyDialog(); },
                onError: () => toast('Có lỗi xảy ra khi tạo khóa API.', 'error'),
                onFinish: () => setIsLoading(false),
            });
        }
    }, [editingKey, closeKeyDialog]);

    const confirmDelete = useCallback(() => {
        if (!selectedKey) return;
        router.delete(route('admin.settings.application-keys.destroy', { id: selectedKey.id }), {
            onSuccess: () => {
                toast('Xóa khóa API thành công!', 'success');
                setSelectedKey(null);
                setIsDeleteDialogOpen(false);
            },
            onError: () => toast('Có lỗi xảy ra khi xóa khóa API.', 'error'),
        });
    }, [selectedKey]);

    return (
        <AppLayout>
            <div className="flex gap-4">
                <Card className="max-w-[400px] w-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Khóa API</CardTitle>
                                <CardDescription>Quản lý khóa API và phân quyền</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openKeyDialog()}>
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm mới
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {applicationKeys.map(key => (
                                <KeyCard
                                    key={key.id}
                                    appKey={key}
                                    isSelected={selectedKey?.id === key.id}
                                    onSelect={handleKeySelect}
                                    onEdit={openKeyDialog}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex-1 w-full space-y-4 overflow-y-auto gap-4">
                    <div className="flex items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm quyền..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            onClick={savePermissions}
                            disabled={!selectedKey || isSavingPermissions}
                            className="ml-4 cursor-pointer"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSavingPermissions && <Loader2 className="h-4 w-4 animate-spin" />}
                            Lưu quyền
                        </Button>
                        <Button
                            onClick={() => setIsDeleteDialogOpen(true)}
                            disabled={!selectedKey || isSavingPermissions}
                            className="ml-4 bg-red-500 hover:bg-red-600 cursor-pointer text-white"
                        >
                            <Trash2 className="h-4 w-4" />
                            Xóa khóa API
                        </Button>
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto">
                        {Object.entries(filteredPermissions).map(([groupName, groupPermissions]) => (
                            <PermissionGroup
                                key={groupName}
                                groupName={groupName}
                                groupPermissions={groupPermissions}
                                originalGroupPermissions={permissions[groupName] || groupPermissions}
                                checkedPermissions={checkedPermissions}
                                onPermissionToggle={handlePermissionToggle}
                                onGroupToggle={handleGroupToggle}
                            />
                        ))}
                    </div>

                    <KeyDialog
                        isOpen={isKeyDialogOpen}
                        editingKey={editingKey}
                        onClose={closeKeyDialog}
                        onSave={saveKey}
                        isLoading={isLoading}
                    />

                    <DeleteConfirmationDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onConfirm={confirmDelete}
                        keyName={selectedKey?.name || ''}
                    />
                </div>
            </div>
        </AppLayout>
    );
};

export default Index;
