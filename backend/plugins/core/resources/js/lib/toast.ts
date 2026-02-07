import { toast as sonnerToast } from "sonner";

type ToastVariant = "success" | "error" | "info" | "warning";

/**
 * Show toast notification using sonner
 * 
 * @example
 * toast('Cập nhật thành công!', 'success');
 * toast('Có lỗi xảy ra!', 'error');
 * toast('Thông tin', 'info');
 * toast('Cảnh báo', 'warning');
 */
export function toast(message: string, variant: ToastVariant = "success") {
  switch (variant) {
    case "success":
      sonnerToast.success(message);
      break;
    case "error":
      sonnerToast.error(message);
      break;
    case "info":
      sonnerToast.info(message);
      break;
    case "warning":
      sonnerToast.warning(message);
      break;
    default:
      sonnerToast(message);
  }
}

// Export sonner toast directly for advanced usage
export { sonnerToast };

