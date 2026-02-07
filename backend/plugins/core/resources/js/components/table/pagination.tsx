"use client"

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@core/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@core/components/ui/pagination";
import { cn } from "@core/lib/utils";

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalRows: number;
    pageSize: number;
    startRow: number;
    endRow: number;
}

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
    pageSize: number;
    setPageSize: (size: number) => void;
    pageIndex: number;
    setPageIndex: (index: number) => void;
    paginationInfo?: PaginationInfo;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const MAX_VISIBLE_PAGES = 7;
const ELLIPSIS_THRESHOLD = 3;

type PageItem = number | "...";

function generatePageNumbers(currentPage: number, totalPages: number): PageItem[] {
    if (totalPages <= MAX_VISIBLE_PAGES) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= ELLIPSIS_THRESHOLD) {
        return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
        return [1, "...", ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export function DataTablePagination<TData>({
    table,
    pageSize,
    setPageSize,
    pageIndex,
    setPageIndex,
    paginationInfo,
}: DataTablePaginationProps<TData>) {
    const currentPage = React.useMemo(() => {
        if (paginationInfo) {
            const expectedPageIndex = paginationInfo.currentPage - 1;
            // Nếu pageIndex khác với paginationInfo, ưu tiên pageIndex (user đang tương tác)
            if (pageIndex !== expectedPageIndex) {
                return pageIndex + 1;
            }
            return paginationInfo.currentPage;
        }
        return pageIndex + 1;
    }, [paginationInfo, pageIndex]);

    // Ưu tiên lấy từ paginationInfo (backend), fallback về table.getPageCount()
    const totalPages = React.useMemo(() => {
        if (paginationInfo && paginationInfo.totalPages > 0) {
            return paginationInfo.totalPages;
        }
        const tablePageCount = table.getPageCount();
        return tablePageCount > 0 ? tablePageCount : 1;
    }, [paginationInfo, table]);
    const totalRows = paginationInfo?.totalRows ?? table.getFilteredRowModel().rows.length;

    const { startRow, endRow } = React.useMemo(
        () =>
            paginationInfo
                ? { startRow: paginationInfo.startRow, endRow: paginationInfo.endRow }
                : {
                      startRow: pageIndex * pageSize + 1,
                      endRow: Math.min((pageIndex + 1) * pageSize, totalRows),
                  },
        [paginationInfo, pageIndex, pageSize, totalRows]
    );

    const pages = React.useMemo(
        () => {
            // Chỉ generate pages khi totalPages > 1
            if (!totalPages || totalPages <= 1) {
                return [];
            }
            return generatePageNumbers(currentPage, totalPages);
        },
        [currentPage, totalPages]
    );

    const canPreviousPage = currentPage > 1;
    const canNextPage = currentPage < totalPages;

    const updatePageIndex = React.useCallback(
        (newIndex: number) => {
            setPageIndex(newIndex);
            if (!paginationInfo) {
                table.setPageIndex(newIndex);
            }
        },
        [setPageIndex, table, paginationInfo]
    );

    const handlePageSizeChange = React.useCallback(
        (newSize: number) => {
            setPageSize(newSize);
            // Luôn reset về page 1 khi thay đổi pageSize
            setPageIndex(0);
            if (!paginationInfo) {
                table.setPageSize(newSize);
                table.setPageIndex(0);
            }
        },
        [setPageSize, setPageIndex, table, paginationInfo]
    );

    const handlePageChange = (pageNum: number) => updatePageIndex(pageNum - 1);
    const handlePreviousPage = () => canPreviousPage && updatePageIndex(pageIndex - 1);
    const handleNextPage = () => canNextPage && updatePageIndex(pageIndex + 1);

    const pageSizeOptions = React.useMemo(() => {
        const options = new Set([...PAGE_SIZE_OPTIONS, pageSize]);
        return Array.from(options).sort((a, b) => a - b);
    }, [pageSize]);

    const handleKeyDown = (e: React.KeyboardEvent, handler: () => void) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handler();
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Hiển thị</span>
                    <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                        <SelectTrigger className="h-8 w-[80px]">
                            <SelectValue placeholder={String(pageSize)} />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((size) => (
                                <SelectItem key={size} value={String(size)}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">kết quả</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Từ {startRow} đến {endRow} trên tổng {totalRows}
                    </span>
                </div>
            </div>

            <div className="flex items-center">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                size="sm"
                                role="button"
                                tabIndex={canPreviousPage ? 0 : -1}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handlePreviousPage();
                                }}
                                onKeyDown={(e) => handleKeyDown(e, handlePreviousPage)}
                                className={cn(
                                    "h-8 text-xs bg-transparent hover:bg-transparent border-transparent hover:border-transparent hover:text-primary cursor-pointer",
                                    !canPreviousPage && "pointer-events-none opacity-50"
                                )}
                            />
                        </PaginationItem>

                        {pages.map((page, index) => {
                            if (page === "...") {
                                return (
                                    <PaginationItem key={`ellipsis-${index}`}>
                                        <PaginationEllipsis className="bg-transparent hover:bg-transparent cursor-default" />
                                    </PaginationItem>
                                );
                            }

                            const isActive = page === currentPage;
                            return (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        size="icon"
                                        role="button"
                                        className={cn(
                                            "bg-transparent hover:bg-transparent text-base border-transparent hover:border-transparent shadow-none hover:text-primary cursor-pointer",
                                            isActive && "font-semibold text-primary",
                                            !isActive && "text-muted-foreground hover:text-primary"
                                        )}
                                        tabIndex={0}
                                        isActive={isActive}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handlePageChange(page);
                                        }}
                                        onKeyDown={(e) => handleKeyDown(e, () => handlePageChange(page))}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}

                        <PaginationItem>
                            <PaginationNext
                                size="sm"
                                role="button"
                                tabIndex={canNextPage ? 0 : -1}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNextPage();
                                }}
                                onKeyDown={(e) => handleKeyDown(e, handleNextPage)}
                                className={cn(
                                    "h-8 text-xs bg-transparent hover:bg-transparent border-transparent hover:border-transparent hover:text-primary cursor-pointer",
                                    !canNextPage && "pointer-events-none opacity-50"
                                )}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}

