"use client";

import Swal from "sweetalert2";

/**
 * ✅ แจ้งเตือนสำเร็จ
 */
export const swalSuccess = (title, text = "") => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer: 1500,
    showConfirmButton: false,
  });
};

/**
 * ❌ แจ้งเตือน error
 */
export const swalError = (title, text = "") => {
  return Swal.fire({
    icon: "error",
    title,
    text,
  });
};

/**
 * ⚠️ confirm ก่อนทำ action สำคัญ
 */
export const swalConfirm = (title, text = "") => {
  return Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
  });
};
