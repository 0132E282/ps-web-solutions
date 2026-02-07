import * as React from "react";
import { Link } from "@inertiajs/react";
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

interface LaravelPaginationProps {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    className?: string;
}

const LaravelPagination = ({ links, className }: LaravelPaginationProps) => {
    if (links.length <= 3) return null;

    return (
        <Pagination className={cn("justify-end", className)}>
            <PaginationContent>
                {links.map((link, i) => {
                    const isFirst = i === 0;
                    const isLast = i === links.length - 1;

                    if (link.label.includes("...")) {
                        return (
                            <PaginationItem key={i}>
                                <PaginationEllipsis />
                            </PaginationItem>
                        );
                    }

                    // Clean labels for Laravel
                    const label = link.label
                        .replace("&laquo; Previous", "")
                        .replace("Next &raquo;", "")
                        .trim();

                    const Component = link.url ? Link : "span";

                    if (isFirst) {
                        return (
                            <PaginationItem key={i}>
                                <PaginationPrevious
                                    asChild
                                    className={cn(
                                        "cursor-pointer",
                                        !link.url && "pointer-events-none opacity-50"
                                    )}
                                >
                                    <Component href={link.url || "#"}>
                                        <span>Previous</span>
                                    </Component>
                                </PaginationPrevious>
                            </PaginationItem>
                        );
                    }

                    if (isLast) {
                        return (
                            <PaginationItem key={i}>
                                <PaginationNext
                                    asChild
                                    className={cn(
                                        "cursor-pointer",
                                        !link.url && "pointer-events-none opacity-50"
                                    )}
                                >
                                    <Component href={link.url || "#"}>
                                        <span>Next</span>
                                    </Component>
                                </PaginationNext>
                            </PaginationItem>
                        );
                    }

                    return (
                        <PaginationItem key={i}>
                            <PaginationLink
                                asChild
                                isActive={link.active}
                                className="cursor-pointer"
                            >
                                <Component href={link.url || "#"}>
                                    {label}
                                </Component>
                            </PaginationLink>
                        </PaginationItem>
                    );
                })}
            </PaginationContent>
        </Pagination>
    );
};

export default LaravelPagination;
