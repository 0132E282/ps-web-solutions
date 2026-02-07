import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

// Utility function to generate random string for componentId
function generateComponentId() {
    return Math.random().toString(36).substr(2, 9);
}

// Check if file is an image based on mime type or extension
function isImageFile(item) {
    if (!item) return false;
    
    const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
    
    if (item.mime_type && imageMimeTypes.includes(item.mime_type.toLowerCase())) {
        return true;
    }
    
    if (item.extension && imageExtensions.includes(item.extension.toLowerCase())) {
        return true;
    }
    
    return false;
}

// Check if file is a video
function isVideoFile(item) {
    if (!item) return false;
    
    const videoMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    
    if (item.mime_type && videoMimeTypes.includes(item.mime_type.toLowerCase())) {
        return true;
    }
    
    if (item.extension && videoExtensions.includes(item.extension.toLowerCase())) {
        return true;
    }
    
    return false;
}

export default class FileManager extends Plugin {
    static get pluginName() {
        return 'FileManager';
    }

    init() {
        const editor = this.editor;
        const config = editor.config.get('fileManager') || {};

        editor.ui.componentFactory.add('fileManager', (locale) => {
            const view = new ButtonView(locale);

            view.set({
                label: config.label || 'File Manager',
                icon: config.icon || '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers-icon lucide-layers"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>',
                tooltip: true,
            });

            const componentId = generateComponentId();

            view.on('execute', () => {
                const openEvent = new CustomEvent('file-manager-open', {
                    bubbles: true,
                    cancelable: true,
                    detail: {
                        multiple: config.multiple !== undefined ? config.multiple : true,
                        componentId,
                        acceptTypes: config.acceptTypes || ['file'],
                        allowedFileTypes: config.allowedFileTypes, // Custom: filter by mime types or extensions
                        maxFileSize: config.maxFileSize, // Custom: max file size in bytes
                        customInsert: config.customInsert, // Custom: custom insert handler
                    },
                });
                document.dispatchEvent(openEvent);

                // Listen for selected items
                const selectItemListener = (event) => {
                    if (event.detail.componentId !== componentId) {
                        return;
                    }

                    const selectedItems = event.detail.items || [];
                    
                    if (selectedItems.length === 0) {
                        document.removeEventListener('file-manager-selected-items', selectItemListener);
                        return;
                    }

                    editor.model.change((writer) => {
                        const insertPosition = editor.model.document.selection.getFirstPosition();

                        selectedItems.forEach((item) => {
                            if (item.type === 'folder') {
                                // Skip folders
                                return;
                            }

                            const url = item.absolute_url || item.path || item.thumbnail;
                            if (!url) {
                                return;
                            }

                            // Use custom insert handler if provided
                            if (config.customInsert && typeof config.customInsert === 'function') {
                                config.customInsert(editor, writer, item, insertPosition);
                                return;
                            }

                            // Default insert behavior
                            if (isImageFile(item)) {
                                // Insert as image block
                                const imageElement = writer.createElement('imageBlock', {
                                    src: url,
                                    alt: item.name || '',
                                });
                                writer.insert(imageElement, insertPosition);
                            } else if (isVideoFile(item)) {
                                // Insert as media embed
                                const mediaEmbedElement = writer.createElement('mediaEmbed', {
                                    url: url,
                                });
                                writer.insert(mediaEmbedElement, insertPosition);
                            } else {
                                // Insert as link
                                const linkElement = writer.createElement('paragraph', {}, [
                                    writer.createText(item.name || 'File', {
                                        linkHref: url,
                                    }),
                                ]);
                                writer.insert(linkElement, insertPosition);
                            }
                        });
                    });

                    document.removeEventListener('file-manager-selected-items', selectItemListener);
                };

                document.addEventListener('file-manager-selected-items', selectItemListener);
            });

            return view;
        });
    }
}
