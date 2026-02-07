export { FileHeader } from "./FileHeader";
export { FileSearchBar } from "./FileSearchBar";
export { FileGrid } from "./FileGrid";
export { FileList } from "./FileList";
export { FileFooter } from "./FileFooter";
export { FileItem } from "./FileItem";
export { FileContextMenu } from "./FileContextMenu";
export { FileContextMenuRightClick } from "./FileContextMenuRightClick";
export { RenameDialog } from "./RenameDialog";
export { MoveDialog } from "./MoveDialog";
export { DuplicateDialog } from "./DuplicateDialog";
export { FileUploadDialog } from "./FileUploadDialog"; // File upload dialog component
export { FileManagerDialog } from "./FileManagerDialog"; // File manager dialog component for CKEditor
export * from "./types";

// Attachment components (for form inputs)
export {
  UploadArea,
  AttachmentRenameDialog,
  getFileName,
  getPreviewUrl,
  handleFileView,
  handleFileDownload,
  sizeClasses,
} from "./attachmentCommon";
export { AttachmentPreview as FilePreview } from "./AttachmentPreview";
export { AttachmentPreviewItem as FilePreviewItem } from "./AttachmentPreviewItem";
export { AttachmentActionsMenu as FileActionsMenu } from "./AttachmentActionsMenu";

