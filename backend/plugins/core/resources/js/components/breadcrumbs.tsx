import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@core/components/ui/breadcrumb';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@core/components/ui/dropdown-menu';
import { type BreadcrumbItem as BreadcrumbItemType } from '@core/types/common';
import { Link, usePage } from '@inertiajs/react';
import { getBreadcrumbs } from '@core/lib/breadcrumbs';
import { getCurrentRouteName } from '@core/lib/route';
import { Fragment, useMemo } from 'react';

const MAX_VISIBLE_ITEMS = 3;

interface BreadcrumbsProps {
    breadcrumbs?: BreadcrumbItemType[];
}

export function Breadcrumbs({ breadcrumbs: propsBreadcrumbs }: BreadcrumbsProps) {
    const page = usePage<{ 
        ziggy?: { route?: { name?: string } };
        item?: Record<string, unknown>;
        [key: string]: unknown;
    }>();
    const routeName = page.props.ziggy?.route?.name || getCurrentRouteName();
    
    // Get item data for show page breadcrumb - check multiple sources
    const itemData = useMemo(() => {
        if (page.props.item && typeof page.props.item === 'object') {
            const item = page.props.item as Record<string, unknown>;
            return item;
        }
        const defaultValues = (page.props as { defaultValues?: Record<string, unknown> })?.defaultValues;
        if (defaultValues && typeof defaultValues === 'object') {
            return defaultValues;
        }

        const data = (page.props as { data?: Record<string, unknown> })?.data;
        if (data && typeof data === 'object') {
            return data;
        }
        return null;
    }, [page.props]);
    
    const breadcrumbs = propsBreadcrumbs || getBreadcrumbs(undefined, routeName, undefined, itemData);
    
    if (breadcrumbs.length === 0) return null;

    // If breadcrumbs are few, show all
    if (breadcrumbs.length <= MAX_VISIBLE_ITEMS) {
        return (
            <Breadcrumb>
                <BreadcrumbList>
                    {breadcrumbs.map((item, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return (
                            <Fragment key={index}>
                                <BreadcrumbItem className="max-w-[200px]">
                                    {isLast ? (
                                        <BreadcrumbPage className="truncate max-w-[200px] whitespace-nowrap" title={item.title}>
                                            {item.title}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link href={item.href || '#'} className="truncate max-w-[200px] whitespace-nowrap" title={item.title}>
                                                {item.title}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && <BreadcrumbSeparator />}
                            </Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        );
    }

    // If breadcrumbs are many, show first, ellipsis, last two
    const firstItem = breadcrumbs[0];
    const lastTwoItems = breadcrumbs.slice(-2);
    const hiddenItems = breadcrumbs.slice(1, -2);

    if (!firstItem) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {/* First item */}
                <BreadcrumbItem className="max-w-[200px]">
                    <BreadcrumbLink asChild>
                        <Link href={firstItem.href || '#'} className="truncate max-w-[200px] whitespace-nowrap" title={firstItem.title}>
                            {firstItem.title}
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />

                {/* Ellipsis with dropdown */}
                <BreadcrumbItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1">
                            <BreadcrumbEllipsis className="size-4" />
                            <span className="sr-only">Toggle menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {hiddenItems.map((item, index) => (
                                <DropdownMenuItem key={index} asChild>
                                    <Link href={item.href || '#'} className="truncate max-w-[200px] whitespace-nowrap" title={item.title}>
                                        {item.title}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator />

                {/* Last two items */}
                {lastTwoItems.map((item, index) => {
                    const isLast = index === lastTwoItems.length - 1;
                    return (
                        <Fragment key={index}>
                            <BreadcrumbItem className="max-w-[200px]">
                                {isLast ? (
                                    <BreadcrumbPage className="truncate max-w-[200px] whitespace-nowrap" title={item.title}>
                                        {item.title}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={item.href || '#'} className="truncate max-w-[200px] whitespace-nowrap" title={item.title}>
                                            {item.title}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
