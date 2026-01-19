"use client";

import { useState, useEffect } from "react";
import { swalSuccess , swalError , swalConfirm} from "../../../components/Swal";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false); // 👈 กันกดซ้ำ

  /* ======================
     FETCH CATEGORIES
  ====================== */
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");

      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Fetch error:", err);
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     ADD CATEGORY
  ====================== */
  const addCategory = async () => {
    if (!newCategory.trim() || isSaving) return;

    try {
      setIsSaving(true);

      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 👇 ถ้าเป็นชื่อซ้ำ ไม่ถือว่าเป็น system error
        if (res.status === 409) {
          setError("ชื่อหมวดหมู่นี้มีอยู่แล้ว");
          return;
        }

        throw new Error(data.error || "Failed to add category");
      }

      setCategories((list) => [...list, data]);
      setNewCategory("");
      setError("");
    } catch (err) {
      console.error("Add error:", err); // เหลือเฉพาะ error จริง
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSaving(false);
    }
  };

  /* ======================
     TOGGLE STATUS
  ====================== */
  const toggleStatus = async (c) => {
    if (!c?.id) {
      console.error("toggleStatus: invalid category", c);
      return;
    }
    const result = await swalConfirm(
      "ปรับหมวดหมู่?"
    );

    if (!result.isConfirmed) return;

    const newStatus = c.status === "active" ? "inactive" : "active";

    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle status");
      }

      setCategories((list) =>
        list.map((item) => (item.id === c.id ? data : item))
      );
      setError("");
      swalSuccess("อัปเดตสำเร็จ");
    } catch (err) {
      swalError("อัปเดตไม่สำเร็จ");
    }
  };

  /* ======================
     DELETE CATEGORY (HARD)
  ====================== */
  const deleteCategory = async (id) => {
    if (!id) return;
     const result = await swalConfirm(
      "ลบหมวดหมู่นี้ถาวร?",`ไม่สามารถกู้คืนได้`
    );
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      setCategories((list) => list.filter((c) => c.id !== id));
      setError("");
      swalSuccess("ลบหมวดหมู่สำเร็จ");
    } catch (err) {
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
          <h1 className="text-2xl font-bold text-slate-800">Categories</h1>
          <p className="text-sm text-slate-500">จัดการหมวดหมู่แพ็กเกจ</p>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ADD CATEGORY */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="font-semibold text-slate-800 mb-4">➕ เพิ่มหมวดหมู่</h2>

        <div className="flex gap-3 max-w-xl">
          <input
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="ชื่อหมวดหมู่"
            value={newCategory}
            disabled={isSaving}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory();
              }
            }}
          />
          <button
            onClick={addCategory}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-lg font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {isSaving ? "กำลังเพิ่ม..." : "เพิ่ม"}
          </button>
        </div>
      </div>

      {/* CATEGORY LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center gap-2">
          <span>📋</span>
          <h2 className="font-semibold text-slate-800">รายการหมวดหมู่</h2>
          <span className="ml-auto text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
            {categories.length} รายการ
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center space-x-2 p-12 text-slate-500">
            <div className="h-3 w-3 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></div>
            <div className="h-3 w-3 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></div>
            <div className="h-3 w-3 animate-bounce rounded-full bg-slate-400"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="group flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[2rem] hover:border-indigo-300 transition-colors duration-500 bg-white">
            <div className="mb-4 text-slate-200 group-hover:text-indigo-200 transition-colors duration-500">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 12V16M12 12H16M12 12H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-slate-500 font-medium tracking-wide">ยังไม่มีรายการหมวดหมู่</p>
              <div className="flex justify-center">
                <div className="h-1 w-8 bg-slate-100 rounded-full group-hover:w-16 group-hover:bg-indigo-100 transition-all duration-500"></div>
              </div>
            </div>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                  ชื่อ
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">{c.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                        className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200"
                      >
                        {c.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteCategory(c.id)}
                        className="px-4 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        🗑️ ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
