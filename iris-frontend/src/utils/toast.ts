// src/utils/toast.ts
import Swal from "sweetalert2";

export const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 1600,
  timerProgressBar: true,
  customClass: {
    popup: "iris-toast",     // จะสไตล์เพิ่มด้านล่าง
  },
});
