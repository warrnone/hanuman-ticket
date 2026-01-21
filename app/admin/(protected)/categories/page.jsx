"use client";

import { useState, useEffect } from "react";
import {swalSuccess,swalError,swalConfirm} from "../../../components/Swal";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 🔹 Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  /* ======================
     FETCH CATEGORIES
  ====================== */
  useEffect(() => {
    fetchCategories(page);
  }, [page]);

  const fetchCategories = async (pageNumber = page) => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/categories?page=${pageNumber}&limit=${PAGE_SIZE}`
      );

      const text = await res.text(); 

      if (!res.ok) {
        throw new Error(text || "Failed to fetch categories");
      }

      const { data, total } = JSON.parse(text);

      setCategories(Array.isArray(data) ? data : []);
      setTotal(total || 0);
      setError("");
    } catch (err) {
      console.error("fetchCategories error:", err);
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     ADD CATEGORY
  ====================== */
  const addCategory = async () => {
    if (!newCategory.trim() || isSaving){
      swalError("กรุณากรอกชื่อหมวดหมู่");
      return;
    };

    try {
      setIsSaving(true);

      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError("ชื่อหมวดหมู่นี้มีอยู่แล้ว");
          return;
        }
        throw new Error(data.error || "Failed to add category");
      }

      // reload หน้าแรก
      setPage(1);
      fetchCategories(1);
      setNewCategory("");
      setError("");
      swalSuccess("เพิ่มหมวดหมู่สำเร็จ");
    } catch (err) {
      console.error("Add error:", err);
      swalError("เพิ่มไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  /* ======================
     TOGGLE STATUS
  ====================== */
  const toggleStatus = async (c) => {
    if (!c?.id) return;

    const result = await swalConfirm("ปรับสถานะหมวดหมู่?");
    if (!result.isConfirmed) return;

    const newStatus = c.status === "active" ? "inactive" : "active";

    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error();

      setCategories((list) =>
        list.map((item) => (item.id === c.id ? data : item))
      );
      swalSuccess("อัปเดตสำเร็จ");
    } catch {
      swalError("อัปเดตไม่สำเร็จ");
    }
  };

  /* ======================
     DELETE CATEGORY
  ====================== */
  const deleteCategory = async (id) => {
    if (!id) return;

    const result = await swalConfirm(
      "ลบหมวดหมู่นี้ถาวร?",
      "ไม่สามารถกู้คืนได้"
    );
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      // ถ้าลบจนหน้าว่าง → ถอยกลับ
      if (categories.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchCategories(page);
      }

      swalSuccess("ลบหมวดหมู่สำเร็จ");
    } catch {
      swalError("ลบไม่สำเร็จ");
    }
  };

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
          <span className="text-2xl">📁</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Categories
          </h1>
          <p className="text-sm text-slate-500">
            จัดการหมวดหมู่แพ็กเกจ
          </p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ADD CATEGORY */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="font-semibold mb-4">➕ เพิ่มหมวดหมู่</h2>
        <div className="flex gap-3 max-w-xl">
          <input
            className="flex-1 border rounded-lg px-4 py-2.5"
            placeholder="ชื่อหมวดหมู่"
            value={newCategory}
            disabled={isSaving}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button
            onClick={addCategory}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-lg text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {isSaving ? "กำลังเพิ่ม..." : "เพิ่ม"}
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center">
          <h2 className="font-semibold">📋 รายการหมวดหมู่</h2>
          <span className="ml-auto text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
            {total} รายการ
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="relative flex h-12 w-12">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-12 w-12 bg-slate-500"></span>
            </div>
            <div className="text-slate-500 font-medium animate-pulse">
              กำลังโหลดข้อมูล...
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            ยังไม่มีรายการ
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs">ชื่อ</th>
                  <th className="px-6 py-3 text-center text-xs">สถานะ</th>
                  <th className="px-6 py-3 text-center text-xs">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">{c.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          c.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => toggleStatus(c)}
                          className="px-4 py-2 text-sm bg-slate-100 rounded-lg"
                        >
                          {c.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteCategory(c.id)}
                          className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg"
                        >
                          🗑️ ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t bg-slate-50">
                <span className="text-sm text-slate-500">
                  หน้า {page} จาก {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    ◀ ก่อนหน้า
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    ถัดไป ▶
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
