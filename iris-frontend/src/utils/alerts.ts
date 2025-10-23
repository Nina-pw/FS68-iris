// src/utils/alerts.ts
import Swal, { type SweetAlertIcon } from "sweetalert2";

type MinimalAlertOpts = {
  icon?: SweetAlertIcon | "custom";
  iconHtml?: string;
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  allowOutsideClick?: boolean;
  allowEscapeKey?: boolean;
  allowEnterKey?: boolean;           // ✅ เพิ่ม
};

export function minimalAlert(opts: MinimalAlertOpts) {
  const {
    icon = "custom",
    iconHtml = "⚠️",
    title,
    text,
    confirmText = "OK",
    cancelText,
    // ✅ ค่าดีฟอลต์: ปิดทุกทางลัด ต้องกดปุ่มเท่านั้น
    allowOutsideClick = false,
    allowEscapeKey = false,
    allowEnterKey = false,
  } = opts;

  return Swal.fire({
    title,
    text,
    icon: icon === "custom" ? undefined : icon,
    iconHtml: icon === "custom" ? iconHtml : undefined,
    width: 520,
    backdrop: "rgba(20,12,12,.35)",

    showConfirmButton: true,
    confirmButtonText: confirmText,
    showCancelButton: Boolean(cancelText),
    cancelButtonText: cancelText,

    // ✅ ให้ปุ่มเรียง [Cancel ซ้าย] [Confirm ขวา]
    reverseButtons: false,
    focusConfirm: !cancelText,

    // ✅ ปิดการปิดกล่องด้วยการคลิกฉากหลัง/ESC/Enter
    allowOutsideClick,
    allowEscapeKey,
    allowEnterKey,

    customClass: {
      popup: "swal2-minimal",
      title: "swal2-minimal__title",
      htmlContainer: "swal2-minimal__text",
      icon: "swal2-minimal__icon",
      actions: "swal2-minimal__actions",        // ✅ ให้มีช่องว่างระหว่างปุ่ม
      confirmButton: "swal2-minimal__btn",
      cancelButton: "swal2-minimal__btn--cancel" // ✅ ปุ่ม Later สีเทา
    },

    showClass: { popup: "swal2-animate-in" },
    hideClass: { popup: "swal2-animate-out" },
  });
}

/** กรณีเลือกเฉด */
export function selectShadeAlert() {
   return minimalAlert({
    title: "Select an option",
    text: "Please choose a shade before adding items.",
    iconHtml: "⚠️",
    confirmText: "Choose",
    cancelText: "Later",          // ← เพิ่มปุ่ม Later
    // ไม่ให้คลิกฉากหลัง/ESC/Enter ปิด ต้องกดปุ่มเท่านั้น
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
  });
}


/** Toast มินิมอลด้านบน (ไว้แจ้งสั้น ๆ) */
export function minimalToast(message: string) {
  return Swal.fire({
    html: message,
    toast: true,
    position: "top",
    timer: 1400,
    timerProgressBar: true,
    showConfirmButton: false,
    backdrop: undefined,
    customClass: { popup: "swal2-toast-minimal" },
    showClass: { popup: "swal2-toast-in" },
    hideClass: { popup: "swal2-toast-out" },
  });
}
