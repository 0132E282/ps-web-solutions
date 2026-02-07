import { SidebarProvider } from '@core/components/ui/sidebar';
import { Toaster } from '@core/components/ui/sonner';
import { SharedData } from '@core/types';
import { usePage } from '@inertiajs/react';
import { FileManagerDialog } from '@core/components/files';
import { useState, useEffect } from 'react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;
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
