import { 
  FileText, 
  File, 
  FileSpreadsheet,
  FileCode,
  FileVideo,
  FileAudio,
  Archive,
  FileImage,
  LucideIcon,
} from "lucide-react";
import { cn } from "@core/lib/utils";

interface FilePreviewProps {
  url?: string;
  alt: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  extension?: string;
  mimeType?: string;
}

// Constants for file extensions
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
const SPREADSHEET_EXTENSIONS = ["xls", "xlsx", "xlsm", "xlsb", "csv"];
const DOCUMENT_EXTENSIONS = ["doc", "docx", "docm", "odt", "rtf"];
const VIDEO_EXTENSIONS = ["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "flac", "aac", "ogg", "m4a"];
const ARCHIVE_EXTENSIONS = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"];
const CODE_EXTENSIONS = ["js", "ts", "jsx", "tsx", "html", "css", "scss", "json", "xml", "yaml", "yml", "py", "java", "cpp", "c", "php", "rb", "go", "rs"];

// Type definition for file category
type FileCategory = 
  | "image" 
  | "pdf" 
  | "spreadsheet" 
  | "document" 
  | "video" 
  | "audio" 
  | "archive" 
  | "code" 
  | "default";

interface FileTypeConfig {
  icon: LucideIcon;
  color: string;
}

const FILE_TYPE_CONFIG: Record<FileCategory, FileTypeConfig> = {
  image: { icon: FileImage, color: "text-blue-500" },
  pdf: { icon: FileText, color: "text-red-500" },
  spreadsheet: { icon: FileSpreadsheet, color: "text-green-600" },
  document: { icon: FileText, color: "text-blue-600" },
  video: { icon: FileVideo, color: "text-purple-500" },
  audio: { icon: FileAudio, color: "text-pink-500" },
  archive: { icon: Archive, color: "text-yellow-600" },
  code: { icon: FileCode, color: "text-orange-500" },
  default: { icon: File, color: "text-muted-foreground" },
};

const getFileCategory = (extension?: string, mimeType?: string): FileCategory => {
  const ext = extension?.toLowerCase() || "";
  const mime = mimeType?.toLowerCase() || "";

  if (mime.startsWith("image/") || IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.includes("spreadsheet") || mime.includes("excel") || SPREADSHEET_EXTENSIONS.includes(ext)) return "spreadsheet";
  if (mime.includes("word") || mime.includes("document") || DOCUMENT_EXTENSIONS.includes(ext)) return "document";
  if (mime.startsWith("video/") || VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (mime.startsWith("audio/") || AUDIO_EXTENSIONS.includes(ext)) return "audio";
  if (mime.includes("zip") || mime.includes("archive") || mime.includes("compressed") || ARCHIVE_EXTENSIONS.includes(ext)) return "archive";
  if (CODE_EXTENSIONS.includes(ext)) return "code";

  return "default";
};

const extractExtension = (name?: string, extension?: string): string | undefined => {
  if (extension) return extension;
  if (name) {
    const lastDot = name.lastIndexOf('.');
    if (lastDot > 0 && lastDot < name.length - 1) {
      return name.substring(lastDot + 1);
    }
  }
  return undefined;
};

export const FilePreview = ({ 
  url, 
  alt, 
  name,
  size = "md",
  className,
  extension,
  mimeType,
}: FilePreviewProps) => {
  const fileExtension = extractExtension(name, extension);
  const isImage = mimeType?.startsWith("image/") || IMAGE_EXTENSIONS.includes(fileExtension?.toLowerCase() || "");
  const containerSize = size === "lg" ? "h-[180px] w-[180px]" : "w-full h-full";

  // Render image preview
  if (url && isImage) {
    return (
      <div className={cn(
        "relative bg-muted flex items-center justify-center shrink-0",
        containerSize,
        className
      )}>
        <img 
          src={url} 
          alt={alt} 
          className="h-full w-full object-cover" 
        />
      </div>
    );
  }

  // Render icon for non-image files
  const category = getFileCategory(fileExtension, mimeType);
  const { icon: IconComponent, color } = FILE_TYPE_CONFIG[category];

  return (
    <div className={cn(
      "relative bg-muted flex items-center justify-center shrink-0",
      containerSize,
      className
    )}>
      <IconComponent className={cn("w-16 h-16", color)} />
    </div>
  );
};

