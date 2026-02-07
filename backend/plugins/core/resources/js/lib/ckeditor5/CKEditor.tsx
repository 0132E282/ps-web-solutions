import React, { useEffect, useRef, useState } from 'react';
import { CKEditor as CKEditorComponent } from '@ckeditor/ckeditor5-react';
import type { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import type { EditorConfig } from '@ckeditor/ckeditor5-core';
import './src/scss/editor.scss';
// Use build file instead of source to avoid SVG icon issues with Vite
// UMD module export workaround for Vite ES module compatibility
// The webpack build exports as UMD with libraryExport: 'default'
// We need to use dynamic import to handle UMD modules properly in Vite
type EditorModuleType = {
    Editor: typeof ClassicEditor & { defaultConfig: EditorConfig };
    EditorWatchdog: unknown;
};

// Pre-load the module using script tag for UMD modules
let editorModulePromise: Promise<EditorModuleType> | null = null;

function loadEditorModule(): Promise<EditorModuleType> {
    if (!editorModulePromise) {
        editorModulePromise = new Promise((resolve, reject) => {
            // Check if already loaded via global variable
            if (typeof window !== 'undefined') {
                const win = window as unknown as Record<string, unknown>;
                if (win.CKSource) {
                    const ckSource = win.CKSource as EditorModuleType;
                    if (ckSource && ckSource.Editor) {
                        resolve(ckSource);
                        return;
                    }
                }
            }

            // Try dynamic import first
            import('./build/ckeditor.js')
                .then((module) => {
                    const moduleObj = module as Record<string, unknown>;
                    
                    // Try multiple ways to access the module
                    const win = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : null;
                    let editorModule: unknown = 
                        moduleObj.default ?? 
                        moduleObj.CKSource ?? 
                        (win?.CKSource ?? null) ??
                        moduleObj;
                    
                    // If still no Editor, check if it's the module itself
                    if (!editorModule || typeof editorModule !== 'object' || !('Editor' in (editorModule as Record<string, unknown>))) {
                        // The module might be the Editor itself if libraryExport: 'default' extracted it
                        // But we expect { Editor, EditorWatchdog }, so try the module as-is
                        editorModule = moduleObj;
                    }
                    
                    // Final check
                    if (editorModule && typeof editorModule === 'object' && 'Editor' in (editorModule as Record<string, unknown>)) {
                        resolve(editorModule as EditorModuleType);
                    } else {
                        // If import failed, try loading as script tag
                        loadViaScriptTag(resolve, reject);
                    }
                })
                .catch(() => {
                    // If import fails, try loading as script tag
                    loadViaScriptTag(resolve, reject);
                });
        });
    }
    return editorModulePromise;
}

function loadViaScriptTag(resolve: (value: EditorModuleType) => void, reject: (error: Error) => void) {
    if (typeof window === 'undefined') {
        reject(new Error('Window is not available'));
        return;
    }

    const win = window as unknown as Record<string, unknown>;

    // Check if script already loaded
    if (win.CKSource) {
        const ckSource = win.CKSource as EditorModuleType;
        if (ckSource && ckSource.Editor) {
            resolve(ckSource);
            return;
        }
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[data-ckeditor-loader]');
    if (existingScript) {
        // Wait for it to load
        existingScript.addEventListener('load', () => {
            const ckSource = win.CKSource as EditorModuleType;
            if (ckSource && ckSource.Editor) {
                resolve(ckSource);
            } else {
                reject(new Error('CKEditor failed to load via script tag'));
            }
        });
        existingScript.addEventListener('error', () => {
            reject(new Error('CKEditor script failed to load'));
        });
        return;
    }

    // Create script tag to load UMD module
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.setAttribute('data-ckeditor-loader', 'true');
    
    // Get the path to the ckeditor.js file
    // In Vite, we need to use the public path or import.meta.url
    const scriptPath = new URL('./build/ckeditor.js', import.meta.url).href;
    script.src = scriptPath;
    
    script.onload = () => {
        // UMD module should expose CKSource on window
        const ckSource = win.CKSource as EditorModuleType;
        if (ckSource && ckSource.Editor) {
            resolve(ckSource);
        } else {
            reject(new Error('CKEditor loaded but CKSource not found on window'));
        }
    };
    
    script.onerror = () => {
        reject(new Error('Failed to load CKEditor script'));
    };
    
    document.head.appendChild(script);
}

export interface CKEditorProps {
  data?: string;
  onChange?: (data: string, editor: ClassicEditor) => void;
  onReady?: (editor: ClassicEditor) => void;
  onFocus?: (event: unknown, editor: ClassicEditor) => void;
  onBlur?: (event: unknown, editor: ClassicEditor) => void;
  onError?: (error: Error, details: { willEditorRestart?: boolean }) => void;
  disabled?: boolean;
  config?: EditorConfig;
  placeholder?: string;
  rows?: number;
}

const CKEditor: React.FC<CKEditorProps> = ({
  data = '',
  onChange,
  onReady,
  onFocus,
  onBlur,
  onError,
  disabled = false,
  config,
  placeholder,
  rows = 10,
}) => {
  const editorRef = useRef<ClassicEditor | null>(null);
  const [EditorModule, setEditorModule] = useState<EditorModuleType | null>(null);

  // Dynamically import the UMD module to handle Vite's ES module system
  useEffect(() => {
    let mounted = true;
    
    loadEditorModule()
      .then((editorModule) => {
        if (!mounted) return;
        setEditorModule(editorModule);
      })
      .catch((error) => {
        console.error('Failed to load CKEditor:', error);
        onError?.(error, { willEditorRestart: false });
      });

    return () => {
      mounted = false;
    };
  }, [onError]);

  useEffect(() => {
    if (editorRef.current) {
      if (disabled) {
        editorRef.current.enableReadOnlyMode('editor-disabled');
      } else {
        editorRef.current.disableReadOnlyMode('editor-disabled');
      }
    }
  }, [disabled]);

  if (!EditorModule || !EditorModule.Editor) {
    return <div className="ckeditor-wrapper">Loading editor...</div>;
  }

  // Safety check: ensure Editor and defaultConfig exist
  if (!EditorModule.Editor.defaultConfig) {
    console.error('CKEditor Editor.defaultConfig is missing', EditorModule);
    return <div className="ckeditor-wrapper">Error: Editor configuration not found</div>;
  }


  const editorConfig: EditorConfig = {
    ...EditorModule.Editor.defaultConfig,
    ...config,
    ...(placeholder && {
      placeholder,
    }),
  };

  return (
    <div className="ckeditor-wrapper">
      <CKEditorComponent
        // @ts-expect-error - Type incompatibility between UMD module types and ES module types
        editor={EditorModule.Editor}
        data={data}
        // @ts-expect-error - Type incompatibility between UMD module types and ES module types  
        config={editorConfig}
        onReady={(editor) => {
          editorRef.current = editor as unknown as ClassicEditor;
          if (disabled) {
            editor.enableReadOnlyMode('editor-disabled');
          }
          onReady?.(editor as unknown as ClassicEditor);
        }}
        onChange={(_event, editor) => {
          const data = editor.getData();
          onChange?.(data, editor as unknown as ClassicEditor);
        }}
        onFocus={onFocus ? (_event, editor) => onFocus(_event, editor as unknown as ClassicEditor) : undefined}
        onBlur={onBlur ? (_event, editor) => onBlur(_event, editor as unknown as ClassicEditor) : undefined}
        onError={onError}
        rows={rows}
      />
    </div>
  );
};

export default CKEditor;

