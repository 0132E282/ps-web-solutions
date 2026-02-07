import { useEffect, useState, type ReactNode } from 'react';
import { usePage } from '@inertiajs/react';

import { FileManagerDialog } from '@core/components/files';
import { SidebarProvider } from '@core/components/ui/sidebar';
import { Toaster } from '@core/components/ui/sonner';
import { toast } from '@core/lib/toast';
import type { SharedData } from '@core/types';

interface AppShellProps {
    children: ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const { flash, sidebarOpen: isOpen } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) toast(flash.success as string, 'success');
        if (flash?.error) toast(flash.error as string, 'error');
        if (flash?.info) toast(flash.info as string, 'info');
        if (flash?.warning) toast(flash.warning as string, 'warning');
    }, [flash]);
    const [fileManagerOpen, setFileManagerOpen] = useState(false);
    const [fileManagerConfig, setFileManagerConfig] = useState<{
        multiple?: boolean;
        acceptTypes?: ('file' | 'folder')[];
        componentId?: string;
        allowedFileTypes?: string[];
        maxFileSize?: number;
    }>({});

    useEffect(() => {
        const handleFileManagerOpen = (event: CustomEvent) => {
            setFileManagerConfig({
                multiple: event.detail.multiple ?? false,
                acceptTypes: event.detail.acceptTypes ?? ['file', 'folder'],
                componentId: event.detail.componentId,
                allowedFileTypes: event.detail.allowedFileTypes,
                maxFileSize: event.detail.maxFileSize,
            });
            setFileManagerOpen(true);
        };

        document.addEventListener('file-manager-open', handleFileManagerOpen as EventListener);

        return () => {
            document.removeEventListener('file-manager-open', handleFileManagerOpen as EventListener);
        };
    }, []);

    if (variant === 'header') {
        return (
            <>
                <div className="flex min-h-screen w-full flex-col">{children}</div>
                <Toaster />
                <FileManagerDialog
                    open={fileManagerOpen}
                    onOpenChange={setFileManagerOpen}
                    multiple={fileManagerConfig.multiple}
                    acceptTypes={fileManagerConfig.acceptTypes}
                    componentId={fileManagerConfig.componentId}
                    allowedFileTypes={fileManagerConfig.allowedFileTypes}
                    maxFileSize={fileManagerConfig.maxFileSize}
                />
            </>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen}>
            {children}
            <Toaster />
            <FileManagerDialog
                open={fileManagerOpen}
                onOpenChange={setFileManagerOpen}
                multiple={fileManagerConfig.multiple}
                acceptTypes={fileManagerConfig.acceptTypes}
                componentId={fileManagerConfig.componentId}
                allowedFileTypes={fileManagerConfig.allowedFileTypes}
                maxFileSize={fileManagerConfig.maxFileSize}
            />
        </SidebarProvider>
    );
}
