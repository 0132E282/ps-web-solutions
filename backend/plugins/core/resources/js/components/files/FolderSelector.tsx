import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { route } from "ziggy-js";
import { Label } from "@core/components/ui/label";
import { Folder, ChevronRight } from "lucide-react";
import type { FileItem } from "./types";
import { cn } from "@core/lib/utils";

interface FolderNode {
  id: string;
  name: string;
  parent_id: string | null;
  children: FolderNode[];
  level: number;
}

interface ApiFolderNode {
  id: string;
  name: string;
  parent_id: string | null;
  children?: ApiFolderNode[];
}

interface FolderSelectorProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  label?: string;
  excludeIds?: string[];
  allItems?: FileItem[];
  loadFromApi?: boolean;
}

export const FolderSelector = ({
  selectedFolderId,
  onSelectFolder,
  label = "Thư mục đích (tùy chọn)",
  excludeIds = [],
  allItems,
  loadFromApi = false,
}: FolderSelectorProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(false);

  // Load folders from API
  useEffect(() => {
    if (!loadFromApi) return;

    let cancelled = false;

    const loadFolders = async () => {
      setLoading(true);
      try {
        const response = await axios.get(route("admin.files.foldersTree"), {
          params: {
            exclude_ids: excludeIds,
          },
        });

        if (cancelled) return;

        const buildTreeWithLevel = (
          nodes: ApiFolderNode[],
          level: number = 0
        ): FolderNode[] => {
          return nodes.map((node) => ({
            id: node.id,
            name: node.name,
            parent_id: node.parent_id,
            children: buildTreeWithLevel(node.children || [], level + 1),
            level,
          }));
        };

        const tree = buildTreeWithLevel(response.data.folders || []);
        setFolderTree(tree);

        // Auto-expand all folders that have children
        const getAllFolderIdsWithChildren = (
          nodes: FolderNode[]
        ): Set<string> => {
          const ids = new Set<string>();
          const traverse = (nodes: FolderNode[]) => {
            nodes.forEach((node) => {
              if (node.children.length > 0) {
                ids.add(node.id);
                traverse(node.children);
              }
            });
          };
          traverse(nodes);
          return ids;
        };

        setExpandedFolders(getAllFolderIdsWithChildren(tree));
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading folders tree:", error);
          setFolderTree([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFolders();

    return () => {
      cancelled = true;
    };
  }, [loadFromApi, excludeIds]);

  // Build folder tree from allItems
  const folderTreeFromItems = useMemo(() => {
    if (!allItems || loadFromApi) return [];

    // Filter folders and exclude specified IDs
    const folders = allItems
      .filter((item) => item.type === "folder" && !excludeIds.includes(item.id))
      .map((folder) => ({
        id: folder.id,
        name: folder.name,
        parent_id: folder.parent_id || null,
      }));

    // Build tree structure
    const buildTree = (
      parentId: string | null = null,
      level: number = 0
    ): FolderNode[] => {
      return folders
        .filter((folder) => folder.parent_id === parentId)
        .map((folder) => ({
          id: folder.id,
          name: folder.name,
          parent_id: folder.parent_id,
          children: buildTree(folder.id, level + 1),
          level,
        }));
    };

    return buildTree();
  }, [allItems, excludeIds, loadFromApi]);

  // Auto-expand all folders that have children when tree changes
  useEffect(() => {
    if (loadFromApi) return; // Already handled in API loading effect

    const getAllFolderIdsWithChildren = (
      nodes: FolderNode[]
    ): Set<string> => {
      const ids = new Set<string>();
      const traverse = (nodes: FolderNode[]) => {
        nodes.forEach((node) => {
          if (node.children.length > 0) {
            ids.add(node.id);
            traverse(node.children);
          }
        });
      };
      traverse(nodes);
      return ids;
    };

    if (folderTreeFromItems.length > 0) {
      setExpandedFolders(getAllFolderIdsWithChildren(folderTreeFromItems));
    }
  }, [folderTreeFromItems, loadFromApi]);

  const displayTree = loadFromApi ? folderTree : folderTreeFromItems;

  const handleToggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const folderTreeItems = useMemo(() => {
    const render = (folder: FolderNode) => {
      const hasChildren = folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;

      return (
        <div key={folder.id}>
          <div
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer",
              isSelected && "bg-primary/10"
            )}
            onClick={() => onSelectFolder(folder.id)}
          >
            <div
              className="flex items-center gap-1 flex-1"
              style={{ paddingLeft: `${folder.level * 16}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFolder(folder.id);
                  }}
                  className="p-0.5"
                >
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>
              ) : (
                <div className="w-5" />
              )}
              <Folder className="h-4 w-4 text-blue-500" />
              <span className="text-sm">{folder.name}</span>
            </div>
          </div>
          {isExpanded && hasChildren && (
            <div>{folder.children.map(render)}</div>
          )}
        </div>
      );
    };
    return displayTree.map(render);
  }, [
    displayTree,
    expandedFolders,
    selectedFolderId,
    handleToggleFolder,
    onSelectFolder,
  ]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border rounded-md max-h-[200px] overflow-y-auto">
        {loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer",
                selectedFolderId === null && "bg-primary/10"
              )}
              onClick={() => onSelectFolder(null)}
            >
              <span className="text-sm text-muted-foreground">
                Thư mục gốc
              </span>
            </div>
            {folderTreeItems}
          </>
        )}
      </div>
    </div>
  );
};

