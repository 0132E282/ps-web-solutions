import { useState, useMemo } from 'react';
import { GripVertical, ChevronRight, ChevronDown, Plus, Minus, ArrowUpToLine, CirclePlus } from 'lucide-react';
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

const buildTree = (items: TreeItemData[], parentId: string | number | null = null): any[] => {
    if (items.some(item => Array.isArray(item.children))) return items;
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
    expandedKeys,
    toggleExpand,
    isOver,
    onMoveOut,
    onAddChild,
}: {
    node: any;
    level?: number;
    selectedId?: string | number | null;
    onSelect?: (item: TreeItemData) => void;
    expandedKeys: Set<string | number>;
    toggleExpand: (id: string | number) => void;
    isOver?: boolean;
    dragDeltaX?: number;
    onMoveOut?: () => void;
    onAddChild?: () => void;
}) => {
    const isExpanded = expandedKeys.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;
    const label = getLocalized(node.name || node.title || `Item ${node.id}`);
    const status = node.status;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
    const style = { transform: CSS.Translate.toString(transform), transition };
    const showIndicator = isOver && !isDragging;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                "relative w-full",
                isDragging && "opacity-40",
                showIndicator && "after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-full"
            )}
        >
            {/* Indent guides */}
            {level > 0 && Array.from({ length: level }).map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 w-px bg-border/40"
                    style={{ left: `${i * 20 + 20}px` }} />
            ))}

            <div
                className={cn(
                    "group relative flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer select-none transition-colors text-sm",
                    isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/60 text-foreground/80 hover:text-foreground"
                )}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
                onClick={() => onSelect?.(node)}
            >
                {/* Selected accent */}
                {isSelected && (
                    <div className="absolute left-0 inset-y-1 w-0.5 bg-primary rounded-r-full" />
                )}

                {/* Expand toggle */}
                <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                    {hasChildren ? (
                        <div
                            className="text-muted-foreground/60 hover:text-foreground transition-colors"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                        >
                            {isExpanded
                                ? <ChevronDown className="w-3.5 h-3.5" />
                                : <ChevronRight className="w-3.5 h-3.5" />}
                        </div>
                    ) : <div className="w-3.5" />}
                </div>

                {/* Drag handle */}
                <div
                    className="text-muted-foreground/30 hover:text-muted-foreground/70 cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-3.5 h-3.5" />
                </div>

                {/* Label */}
                <span className="flex-1 truncate text-[13px]">{label}</span>

                {/* Status badge */}
                {status && (
                    <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                        status === 'published'
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                    )}>
                        <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            status === 'published' ? "bg-emerald-500" : "bg-amber-400"
                        )} />
                        {status === 'published' ? 'Hiển thị' : 'Nháp'}
                    </span>
                )}

                {/* Child count */}
                {hasChildren && (
                    <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0">
                        {node.children.length}
                    </span>
                )}

                {/* Inline actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {onMoveOut && (
                        <button
                            type="button"
                            title="Chuyển lên cấp trên"
                            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors"
                            onClick={(e) => { e.stopPropagation(); onMoveOut(); }}
                        >
                            <ArrowUpToLine className="w-3 h-3" />
                        </button>
                    )}
                    {onAddChild && (
                        <button
                            type="button"
                            title="Thêm mục con"
                            className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors"
                            onClick={(e) => { e.stopPropagation(); onAddChild(); }}
                        >
                            <CirclePlus className="w-3 h-3" />
                        </button>
                    )}
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
    onAddChild,
    onMove,
    className,
}: TreeSidebarProps) => {
    const treeData = useMemo(() => buildTree(items), [items]);
    const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());
    const [activeId, setActiveId]   = useState<string | number | null>(null);
    const [overId, setOverId]       = useState<string | number | null>(null);
    const [dragDeltaX, setDragDeltaX] = useState(0);

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

    const toggleExpand = (id: string | number) => {
        setExpandedKeys(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleDragStart = (e: DragStartEvent) => { setActiveId(e.active.id); setOverId(null); setDragDeltaX(0); };
    const handleDragOver  = (e: DragOverEvent)  => { setOverId(e.over?.id ?? null); };
    const handleDragMove  = (e: DragMoveEvent)  => { setDragDeltaX(e.delta.x); };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null); setOverId(null); setDragDeltaX(0);
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
    };

    const expandAll = () => {
        const ids = new Set<string | number>();
        const walk = (nodes: any[]) => nodes.forEach(n => { if (n.children?.length) { ids.add(n.id); walk(n.children); } });
        walk(treeData);
        setExpandedKeys(ids);
    };
    const collapseAll = () => setExpandedKeys(new Set());

    const flatIds = useMemo(() => flatVisible.map(f => f.node.id), [flatVisible]);

    return (
        <div className={cn("flex flex-col border rounded-xl bg-card shadow-sm overflow-hidden h-[calc(100vh-10rem)]", className)}>

            {/* ── Toolbar ────────────────────────────── */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-background shrink-0 flex-wrap">
                {onCreateClick && (
                    <Button size="sm" onClick={onCreateClick} className="gap-1.5 h-8 px-3 text-sm font-medium">
                        <Plus className="w-3.5 h-3.5" />
                        Thêm mới
                    </Button>
                )}
                <Button size="sm" variant="outline" onClick={collapseAll} className="gap-1.5 h-8 px-3 text-sm font-medium">
                    <Minus className="w-3.5 h-3.5" />
                    Thu gọn
                </Button>
                <Button size="sm" variant="outline" onClick={expandAll} className="gap-1.5 h-8 px-3 text-sm font-medium">
                    <Plus className="w-3.5 h-3.5" />
                    Mở rộng
                </Button>
            </div>

            {/* ── Tree list ──────────────────────────── */}
            <ScrollArea className="flex-1">
                {treeData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                            <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground/60">Không có dữ liệu</p>
                            <p className="text-xs text-muted-foreground/40 mt-0.5">Hãy thêm mục đầu tiên.</p>
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
                            <div className="p-2 flex flex-col gap-0.5">
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
                                            expandedKeys={expandedKeys}
                                            toggleExpand={toggleExpand}
                                            isOver={overId === node.id && activeId !== node.id}
                                            dragDeltaX={dragDeltaX}
                                            onMoveOut={handleMoveOut}
                                            onAddChild={handleAddChild}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </ScrollArea>
        </div>
    );
};
