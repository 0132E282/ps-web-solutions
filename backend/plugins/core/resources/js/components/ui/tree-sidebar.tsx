import { useState, useMemo } from 'react';
import { Plus, Trash2, GripVertical, Copy, MoreVertical, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { cn } from '@core/lib/utils';
import { ScrollArea } from './scroll-area';
import { tt, getLocalized } from '@core/lib/i18n';
import { Checkbox } from './checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './dropdown-menu';
import {
    DndContext,
    closestCenter,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
    DragMoveEvent,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
} from '@dnd-kit/core';
// Sortable imports
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface TreeItemData {
    id: string | number;
    parent_id?: string | number | null;
    name?: string;
    title?: string;
    [key: string]: any;
}

interface TreeSidebarProps {
    items: TreeItemData[];
    selectedId?: string | number | null;
    onSelect?: (item: TreeItemData | null) => void;
    onCreateClick?: () => void;
    onDelete?: (id: string | number) => void;
    onDuplicate?: (id: string | number) => void;
    onMove?: (id: string | number, newParentId: string | number | null) => void;
    selectedIds?: (string | number)[];
    onSelectionChange?: (ids: (string | number)[]) => void;
    onBulkAction?: (action: string, ids: (string | number)[]) => void;
    className?: string;
}

const buildTree = (items: TreeItemData[], parentId: string | number | null = null): any[] => {
    // If the data already contains hierarchical structure (children arrays), just return it
    if (items.some(item => Array.isArray(item.children))) {
        return items;
    }

    return items
        .filter(item => item.parent_id === parentId || (parentId === null && !item.parent_id))
        .map(item => ({
            ...item,
            title: getLocalized(item.name || item.title || `Item ${item.id}`),
            children: buildTree(items, item.id),
        }));
};

const TreeNode = ({
    node,
    level = 0,
    selectedId,
    onSelect,
    onDelete,
    onDuplicate,
    isSelectedForBulk,
    onToggleBulk,
    expandedKeys,
    toggleExpand,
    isOver,
}: {
    node: any;
    level?: number;
    selectedId?: string | number | null;
    onSelect?: (item: TreeItemData) => void;
    onDelete?: (id: string | number) => void;
    onDuplicate?: (id: string | number) => void;
    isSelectedForBulk?: boolean;
    onToggleBulk?: (id: string | number, checked: boolean) => void;
    expandedKeys: Set<string | number>;
    toggleExpand: (id: string | number) => void;
    isOver?: boolean;
    dragDeltaX?: number;
}) => {
    const isExpanded = expandedKeys.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;
    const label = getLocalized(node.name || node.title || `Item ${node.id}`);
    const status = node.status;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: node.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const showIndicator = isOver && !isDragging;

    return (
        <div
            className={cn("w-full relative", showIndicator && "border-b-2 border-primary")}
            ref={setNodeRef}
            style={style}
        >
            {/* Hierarchy Guides */}
            {level > 0 && Array.from({ length: level }).map((_, i) => (
                <div
                    key={i}
                    className="absolute h-full w-px bg-muted-foreground/10"
                    style={{ left: `${(i * 16) + 24}px` }}
                />
            ))}

            <div
                className={cn(
                    "flex items-center py-2 px-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-all text-sm group relative mx-1 my-0.5",
                    isSelected
                        ? "bg-primary/10 text-primary font-bold ring-1 ring-primary/20 shadow-sm"
                        : "text-foreground/80 hover:text-foreground"
                )}
                style={{ paddingLeft: `${Math.max(12, level * 16 + 12)}px` }}
                onClick={() => onSelect?.(node)}
            >
                {/* Active Indicator */}
                {isSelected && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
                )}

                <div className="flex items-center gap-2 mr-3 z-10">
                    <Checkbox
                        checked={isSelectedForBulk}
                        onCheckedChange={(checked) => onToggleBulk?.(node.id, !!checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded-sm border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-200"
                    />

                    {hasChildren && (
                        <div
                            className="w-5 h-5 flex items-center justify-center shrink-0 rounded-md transition-all cursor-pointer hover:bg-muted-foreground/10 text-muted-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(node.id);
                            }}
                        >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </div>
                    )}

                    <div className="w-4 h-4 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors" {...attributes} {...listeners}>
                        <GripVertical className="w-4 h-4" />
                    </div>
                </div>

                <span className="truncate flex-1 py-0.5">{label}</span>

                {status && (
                    <Badge
                        variant="outline"
                        className={cn(
                            "ml-2 h-5 px-2 text-[10px] uppercase font-bold tracking-tight rounded-full border-0 shadow-none transition-colors",
                            status === 'published'
                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
                        )}
                    >
                        <div className={cn("w-1 h-1 rounded-full mr-1.5 animate-pulse", status === 'published' ? "bg-emerald-500" : "bg-orange-500")} />
                        {status === 'published' ? 'Hiển thị' : 'Nháp'}
                    </Badge>
                )}

                {node.children && node.children.length > 0 && (
                    <span className="text-[10px] text-muted-foreground/60 ml-2 bg-muted px-1.5 py-0.5 rounded-sm font-medium">
                        {node.children.length}
                    </span>
                )}

                <div className="flex items-center ml-2 transition-all">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="icon"
                                className={cn(
                                    "h-7 w-7 transition-all flex items-center justify-center",
                                    "bg-linear-to-b from-white to-gray-100 text-gray-700",
                                    "group-hover:bg-primary group-hover:from-primary group-hover:to-primary group-hover:text-white"
                                )}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDuplicate?.(node.id);
                                }}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                <span>{tt('common.duplicate')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const confirmText = tt('common.confirm_delete');
                                    if (window.confirm(confirmText === 'common.confirm_delete' ? 'Bạn có chắc chắn muốn xóa không?' : confirmText)) {
                                        onDelete?.(node.id);
                                    }
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>{tt('common.delete')}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
};

export const TreeSidebar = ({
    items,
    selectedId,
    onSelect,
    onCreateClick,
    onDelete,
    onDuplicate,
    onMove,
    selectedIds = [],
    onSelectionChange,
    onBulkAction,
    className
}: TreeSidebarProps) => {
    const treeData = useMemo(() => buildTree(items), [items]);
    const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());
    const [activeId, setActiveId] = useState<string | number | null>(null);
    const [overId, setOverId] = useState<string | number | null>(null);
    const [dragDeltaX, setDragDeltaX] = useState(0);

    const flatVisible = useMemo(() => {
        const flatten = (nodes: any[], level = 0): Array<{ node: any; level: number }> => {
            const result: Array<{ node: any; level: number }> = [];
            for (const node of nodes) {
                result.push({ node, level });
                if (expandedKeys.has(node.id) && node.children?.length > 0) {
                    result.push(...flatten(node.children, level + 1));
                }
            }
            return result;
        };
        return flatten(treeData);
    }, [treeData, expandedKeys]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const toggleExpand = (id: string | number) => {
        setExpandedKeys(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };
    const handleToggleBulk = (id: string | number, checked: boolean) => {
        if (!onSelectionChange) return;

        const nextSelection = checked
            ? [...selectedIds, id]
            : selectedIds.filter(selectedId => selectedId !== id);

        onSelectionChange(nextSelection);
    };

    const handleSelectAll = (checked: boolean) => {
        if (!onSelectionChange) return;
        onSelectionChange(checked ? items.map(i => i.id) : []);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
        setOverId(null);
        setDragDeltaX(0);
    };

    const handleDragOver = (event: DragOverEvent) => {
        setOverId(event.over?.id ?? null);
    };

    const handleDragMove = (event: DragMoveEvent) => {
        setDragDeltaX(event.delta.x);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        setOverId(null);
        setDragDeltaX(0);
        const { active, over, delta } = event;

        if (over && active.id !== over.id) {
            const activeItem = items.find(item => item.id === active.id);
            const overItem = items.find(item => item.id === over.id);

            if (activeItem && overItem) {
                let newParentId: string | number | null = overItem.parent_id ?? null;

                if (delta.x > 30) {
                    // Indent right → become child of overItem
                    newParentId = overItem.id;
                } else if (delta.x < -30) {
                    // Indent left → go up one level from activeItem's current parent, max = null
                    const activeParent = items.find(i => i.id === activeItem.parent_id);
                    newParentId = activeParent ? (activeParent.parent_id ?? null) : null;
                }

                if (activeItem.parent_id !== newParentId) {
                    // Basic circular check: activeItem cannot be parent of newParentId
                    const isParentOf = (parentId: any, targetId: any): boolean => {
                        const directChildren = items.filter(i => i.parent_id === parentId);
                        if (directChildren.some(i => i.id === targetId)) return true;
                        return directChildren.some(i => isParentOf(i.id, targetId));
                    };

                    if (newParentId === null || !isParentOf(active.id, newParentId)) {
                        onMove?.(activeItem.id, newParentId);
                    }
                }
            }
        }
    };

    const expandAll = () => {
        const allIds = new Set<string | number>();
        const traverse = (nodes: any[]) => {
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    allIds.add(node.id);
                    traverse(node.children);
                }
            });
        };
        traverse(treeData);
        setExpandedKeys(allIds);
    };

    const collapseAll = () => {
        setExpandedKeys(new Set());
    };

    const flatIds = useMemo(() => flatVisible.map(f => f.node.id), [flatVisible]);
    const isAllSelected = items.length > 0 && selectedIds.length === items.length;

    return (
        <div className={cn("flex flex-col border rounded-xl bg-card/50 backdrop-blur-sm h-[calc(100vh-14rem)] shadow-sm overflow-hidden", className)}>
            <div className="flex flex-col p-3 border-b bg-muted/20 shrink-0 gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {onCreateClick && (
                            <Button
                                size="sm"
                                onClick={onCreateClick}
                                className="h-7 px-2 shadow-sm bg-primary hover:bg-primary/90 text-white font-semibold text-[11px] rounded-md transition-all active:scale-95"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                {tt('common.add_new') === 'common.add_new' ? 'Thêm mới' : tt('common.add_new')}
                            </Button>
                        )}

                        <div className="flex items-center gap-2 ml-1">
                            <div className="w-px h-6 bg-border mx-1" />
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={selectedIds.length === 0}
                                onClick={() => onBulkAction?.('duplicate', selectedIds)}
                                className="h-7 px-2 border-dashed hover:bg-primary/5 hover:text-primary text-[11px] font-medium rounded-md border-muted-foreground/20"
                            >
                                <Copy className="w-3 h-3 mr-1" />
                                {tt('common.duplicate') === 'common.duplicate' ? 'Nhân bản' : tt('common.duplicate')}
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={selectedIds.length === 0}
                                onClick={() => {
                                    if (window.confirm(tt('common.confirm_bulk_delete'))) {
                                        onBulkAction?.('delete', selectedIds);
                                    }
                                }}
                                className="h-7 px-2 shadow-sm text-[11px] font-medium rounded-md"
                            >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Xóa ({selectedIds.length})
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={cn(
                "py-2.5 px-5 transition-all border-b flex items-center justify-between",
                selectedIds.length > 0 ? "bg-primary/10 border-primary/20" : "bg-muted/5 border-transparent"
            )}>
                <div className="flex items-center gap-3">
                    <Checkbox
                        id="select-all-tree"
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        className="h-4 w-4 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-transform active:scale-90"
                    />
                    <label
                        htmlFor="select-all-tree"
                        className={cn(
                            "text-xs font-semibold cursor-pointer select-none transition-colors",
                            selectedIds.length > 0 ? "text-primary" : "text-muted-foreground/60"
                        )}
                    >
                        {selectedIds.length > 0
                            ? `Đã chọn ${selectedIds.length} mục`
                            : (tt('common.select_all') === 'common.select_all' ? 'Chọn tất cả' : tt('common.select_all'))}
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    {expandedKeys.size > 0 ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={collapseAll}
                            className="h-8 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-1.5 rounded-lg border border-transparent hover:border-border/40 transition-all active:scale-95"
                            title={tt('common.collapse_all') === 'common.collapse_all' ? 'Đóng tất cả' : tt('common.collapse_all')}
                        >
                            <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                            <span className="text-[11px] font-bold uppercase tracking-tight">Đóng</span>
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={expandAll}
                            className="h-8 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-1.5 rounded-lg border border-transparent hover:border-border/40 transition-all active:scale-95"
                            title={tt('common.expand_all') === 'common.expand_all' ? 'Mở tất cả' : tt('common.expand_all')}
                        >
                            <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                            <span className="text-[11px] font-bold uppercase tracking-tight">Mở</span>
                        </Button>
                    )}
                </div>
            </div>
            <ScrollArea className="flex-1 p-2">
                {treeData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                            <Plus className="w-6 h-6 text-muted-foreground/40 rotate-45" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground/80">{tt('common.no_data') === 'common.no_data' ? 'Không có dữ liệu' : tt('common.no_data')}</p>
                            <p className="text-xs text-muted-foreground/60 max-w-[180px] leading-relaxed">
                                Hãy thêm mục mới để bắt đầu xây dựng cấu trúc của bạn.
                            </p>
                        </div>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={flatIds}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col gap-0.5">
                                {flatVisible.map(({ node, level }) => (
                                    <TreeNode
                                        key={node.id}
                                        node={node}
                                        level={level}
                                        selectedId={selectedId}
                                        onSelect={onSelect}
                                        onDelete={onDelete}
                                        onDuplicate={onDuplicate}
                                        isSelectedForBulk={selectedIds.includes(node.id)}
                                        onToggleBulk={handleToggleBulk}
                                        expandedKeys={expandedKeys}
                                        toggleExpand={toggleExpand}
                                        isOver={overId === node.id && activeId !== node.id}
                                        dragDeltaX={dragDeltaX}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </ScrollArea>
        </div>
    );
};
