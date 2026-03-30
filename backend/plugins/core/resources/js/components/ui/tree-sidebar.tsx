import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GripVertical, ChevronDown, Plus, ArrowUpToLine, CirclePlus, ListTree, FolderMinus, FolderPlus } from 'lucide-react';
import { Button } from './button';
import { cn } from '@core/lib/utils';
import { ScrollArea } from './scroll-area';
import { getLocalized } from '@core/lib/i18n';
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
    onAddChild?: (parentId: string | number) => void;
    onMove?: (id: string | number, newParentId: string | number | null) => void;
    className?: string;
}

const buildTree = (items: TreeItemData[]): any[] => {
    if (!items || items.length === 0) return [];

    const cloneAndEnrich = (node: any): any => {
        const newNode = { ...node };
        if (!newNode.title) {
            newNode.title = getLocalized(newNode.name || newNode.title || `Item ${newNode.id}`);
        }
        if (Array.isArray(newNode.children)) {
            newNode.children = newNode.children.map(cloneAndEnrich);
        }
        return newNode;
    };

    // If already a tree structure (has children arrays), return immutable clones with enriched titles
    if (items.some(item => Array.isArray(item.children))) {
        return items.map(cloneAndEnrich);
    }

    const itemMap = new Map<string | number, any>();
    const roots: any[] = [];

    // First pass: Create nodes with localized titles and empty children
    for (const item of items) {
        itemMap.set(item.id, {
            ...item,
            title: getLocalized(item.name || item.title || `Item ${item.id}`),
            children: [],
        });
    }

    // Second pass: Build the tree structure
    for (const item of items) {
        const node = itemMap.get(item.id);
        const parentId = item.parent_id;

        if (parentId && itemMap.has(parentId)) {
            itemMap.get(parentId).children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
};

const TreeNode = React.memo(({
    node,
    level = 0,
    selectedId,
    onSelect,
    isExpanded,
    toggleExpand,
    isOver,
    onMoveOut,
    onAddChild,
}: {
    node: any;
    level?: number;
    selectedId?: string | number | null;
    onSelect?: (item: TreeItemData) => void;
    isExpanded: boolean;
    toggleExpand: (id: string | number) => void;
    isOver?: boolean;
    onMoveOut?: () => void;
    onAddChild?: () => void;
}) => {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;
    const label = node.title;
    const status = node.status;

    const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const showIndicator = isOver && !isDragging;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative w-full group/node",
                isDragging && "opacity-40 z-50",
                showIndicator && "after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full after:shadow-[0_0_8px_rgba(var(--primary),0.4)]"
            )}
        >
            {/* Indent guides */}
            {level > 0 && Array.from({ length: level }).map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 w-px bg-border/30"
                    style={{ left: `${i * 20 + 20}px` }} />
            ))}

            <div
                className={cn(
                    "group/item relative flex items-center gap-3 rounded-sm px-3 py-1 cursor-pointer select-none transition-all duration-300 text-sm",
                    isSelected
                        ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/25 font-semibold"
                        : "hover:bg-primary/5 text-foreground hover:text-primary hover:shadow-md hover:shadow-primary/5"
                )}
                style={{ marginLeft: `${level * 20}px` }}
                onClick={() => onSelect?.(node)}
            >
                <div
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-7 flex items-center justify-center rounded-sm bg-background border border-border shadow-md text-muted-foreground/40 hover:text-primary hover:border-primary/30 transition-all opacity-0 group-hover/node:opacity-100 cursor-grab active:cursor-grabbing z-20 scale-90 group-hover/node:scale-100"
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-4 h-4" />
                </div>

                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                    {hasChildren ? (
                        <div
                            className={cn(
                                "p-1 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300",
                                isExpanded ? "rotate-0" : "-rotate-90"
                            )}
                            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                        >
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    ) : <div className="w-4 h-4" />}
                </div>

                {/* Label */}
                <span className="flex-1 truncate text-[13px] leading-tight">{label}</span>

                {/* Status badge */}
                {status && (
                    <div className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                        status === 'published'
                            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20"
                    )}>
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            status === 'published' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        )} />
                        {status === 'published' ? 'Hiển thị' : 'Nháp'}
                    </div>
                )}

                {/* Child count */}
                {hasChildren && !isExpanded && (
                    <span className="flex items-center justify-center min-w-5 h-5 px-1 bg-muted/50 rounded text-[10px] text-muted-foreground font-medium tabular-nums shrink-0">
                        {node.children.length}
                    </span>
                )}

                {/* Inline actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {onMoveOut && (
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Chuyển lên cấp trên"
                            className="w-7 h-7 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10 shadow-none transition-all duration-200"
                            onClick={(e) => { e.stopPropagation(); onMoveOut(); }}
                        >
                            <ArrowUpToLine className="w-3.5 h-3.5" />
                        </Button>
                    )}
                    {onAddChild && (
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Thêm mục con"
                            className="w-7 h-7 rounded-lg text-muted-foreground/50 hover:text-primary hover:bg-primary/10 shadow-none transition-all duration-200"
                            onClick={(e) => { e.stopPropagation(); onAddChild(); }}
                        >
                            <CirclePlus className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
});

export const TreeSidebar = ({
    items,
    selectedId,
    onSelect,
    onCreateClick,
    onAddChild,
    onMove,
    className,
}: TreeSidebarProps) => {
    const treeData = useMemo(() => buildTree(items), [items]);
    const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());
    const hasAutoExpanded = React.useRef(false);
    const [activeId, setActiveId]   = useState<string | number | null>(null);
    const [overId, setOverId]       = useState<string | number | null>(null);

    // Default expand all on first load
    useEffect(() => {
        if (treeData.length > 0 && !hasAutoExpanded.current) {
            const allIds = new Set<string | number>();
            const collectIds = (nodes: any[]) => {
                nodes.forEach(node => {
                    allIds.add(node.id);
                    if (node.children?.length > 0) collectIds(node.children);
                });
            };
            collectIds(treeData);
            setExpandedKeys(allIds);
            hasAutoExpanded.current = true;
        }
    }, [treeData]);

    const flatVisible = useMemo(() => {
        const flatten = (nodes: any[], level = 0): Array<{ node: any; level: number }> => {
            const result: Array<{ node: any; level: number }> = [];
            for (const node of nodes) {
                result.push({ node, level });
                if (expandedKeys.has(node.id) && node.children?.length > 0)
                    result.push(...flatten(node.children, level + 1));
            }
            return result;
        };
        return flatten(treeData);
    }, [treeData, expandedKeys]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const toggleExpand = useCallback((id: string | number) => {
        setExpandedKeys(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const handleDragStart = useCallback((e: DragStartEvent) => { setActiveId(e.active.id); setOverId(null); }, []);
    const handleDragOver  = useCallback((e: DragOverEvent)  => { setOverId(e.over?.id ?? null); }, []);
    const handleDragMove  = useCallback((e: DragMoveEvent)  => { }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveId(null); setOverId(null);
        const { active, over, delta } = event;
        if (!over || active.id === over.id) return;

        const activeItem = items.find(i => i.id === active.id);
        const overItem   = items.find(i => i.id === over.id);
        if (!activeItem || !overItem) return;

        let newParentId: string | number | null = overItem.parent_id ?? null;
        if (delta.x > 30)       newParentId = overItem.id;
        else if (delta.x < -30) {
            const p = items.find(i => i.id === activeItem.parent_id);
            newParentId = p ? (p.parent_id ?? null) : null;
        }

        if (activeItem.parent_id !== newParentId) {
            const isParentOf = (pid: any, tid: any): boolean => {
                const ch = items.filter(i => i.parent_id === pid);
                return ch.some(i => i.id === tid) || ch.some(i => isParentOf(i.id, tid));
            };
            if (newParentId === null || !isParentOf(active.id, newParentId))
                onMove?.(activeItem.id, newParentId);
        }
    }, [items, onMove]);

    const expandAll = useCallback(() => {
        const ids = new Set<string | number>();
        const walk = (nodes: any[]) => nodes.forEach(n => { if (n.children?.length) { ids.add(n.id); walk(n.children); } });
        walk(treeData);
        setExpandedKeys(ids);
    }, [treeData]);

    const collapseAll = useCallback(() => setExpandedKeys(new Set()), []);

    const flatIds = useMemo(() => flatVisible.map(f => f.node.id), [flatVisible]);

    return (
        <div className={cn("flex flex-col border rounded-xl bg-card shadow-sm h-[calc(100vh-10rem)]", className)}>

            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20 shrink-0">
                <div className="flex items-center gap-2">
                    <ListTree className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Danh mục</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={collapseAll}
                        className="h-8 gap-1.5 px-2 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all duration-200 font-medium"
                    >
                        <FolderMinus className="w-4 h-4" />
                        <span className="text-xs">Thu gọn</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={expandAll}
                        className="h-8 gap-1.5 px-2 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all duration-200 font-medium"
                    >
                        <FolderPlus className="w-4 h-4" />
                        <span className="text-xs">Mở rộng</span>
                    </Button>
                    {onCreateClick && (
                        <Button
                            size="sm"
                            onClick={onCreateClick}
                            className="ml-1 gap-1.5 h-8 px-3 rounded-lg shadow-none font-medium"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-xs">Thêm mới</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Tree list ──────────────────────────── */}
            <ScrollArea className="flex-1">
                <div className="pt-2 pb-6 flex flex-col gap-0.5 px-3">
                    {treeData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                            <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center border border-dashed border-border">
                                <ListTree className="w-8 h-8 text-muted-foreground/20" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground/70">Chưa có dữ liệu</p>
                                <p className="text-xs text-muted-foreground/50">Hãy bắt đầu bằng cách thêm mục mới.</p>
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
                            <SortableContext items={flatIds} strategy={verticalListSortingStrategy}>
                                {flatVisible.map(({ node, level }) => {
                                    const item = items.find(i => i.id === node.id);

                                    // Outdent: move to grandparent level
                                    const canMoveOut = onMove && item && item.parent_id != null;
                                    const handleMoveOut = canMoveOut ? () => {
                                        const parent = items.find(i => i.id === item.parent_id);
                                        onMove!(item.id, parent?.parent_id ?? null);
                                    } : undefined;

                                    // Add child
                                    const handleAddChild = onAddChild ? () => {
                                        onAddChild(node.id);
                                        setExpandedKeys(prev => new Set([...prev, node.id]));
                                    } : undefined;

                                    return (
                                        <TreeNode
                                            key={node.id}
                                            node={node}
                                            level={level}
                                            selectedId={selectedId}
                                            onSelect={onSelect}
                                            isExpanded={expandedKeys.has(node.id)}
                                            toggleExpand={toggleExpand}
                                            isOver={overId === node.id && activeId !== node.id}
                                            onMoveOut={handleMoveOut}
                                            onAddChild={handleAddChild}
                                        />
                                    );
                                })}
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
