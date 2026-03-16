"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedCount, setCachedCount] = useState(3);

  // Filter + Search
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // ======================
  // PAGINATION
  // ======================
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  // Filter
  const filteredUsers = users.filter((u) => {
    const text = search.toLowerCase();

    const matchSearch =
      u.username?.toLowerCase().includes(text) ||
      u.first_name?.toLowerCase().includes(text) ||
      u.last_name?.toLowerCase().includes(text);

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.is_active) ||
      (statusFilter === "disabled" && !u.is_active);

    return matchSearch  && matchStatus;
  });

  const totalPages = Math.max(1,Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE,page * PAGE_SIZE);

  // ======================
  // FETCH USERS
  // ======================
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.replace("/admin/login");
          return;
        }
        throw new Error("Fetch users failed");
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setCachedCount(data.length);
      }
    } catch (err) {
      swalError("ไม่สามารถโหลดข้อมูลพนักงานได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ======================
  // INIT LOAD
  // ======================
  useEffect(() => {
    fetchUsers();
  }, []);

  // กัน page เกินหลังลบข้อมูล
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [users.length, totalPages, page]);

  // ======================
  // TOGGLE ACTIVE
  // ======================
  const toggleActive = async (user) => {
    if (!user.id) {
      swalError("ไม่พบ User ID");
      return;
    }

    const prev = user.is_active;

    // optimistic update
    setUsers((list) =>
      list.map((u) =>
        u.id === user.id ? { ...u, is_active: !prev } : u
      )
    );

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !prev }),
      });

      if (!res.ok) throw new Error();

      swalSuccess(
        "อัปเดตสำเร็จ",
        prev ? "ปิดการใช้งานแล้ว" : "เปิดการใช้งานแล้ว"
      );
    } catch {
      // rollback
      setUsers((list) =>
        list.map((u) =>
          u.id === user.id ? { ...u, is_active: prev } : u
        )
      );
      swalError("อัปเดตไม่สำเร็จ");
    }
  };

  // ======================
  // DELETE USER
  // ======================
  const deleteUser = async (user) => {
    if (!user.id) {
      swalError("ไม่พบ user id");
      return;
    }

    const result = await swalConfirm(
      "ลบพนักงาน?",
      `ต้องการลบ ${user.username} ถาวรหรือไม่`
    );

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        swalError("ลบไม่สำเร็จ", data.error);
        return;
      }

      setUsers((list) => list.filter((u) => u.id !== user.id));
      swalSuccess("ลบสำเร็จ", "ข้อมูลถูกลบออกจากระบบแล้ว");
    } catch {
      swalError("เกิดข้อผิดพลาด");
    }
  };

  // ======================
  // UI
  // ======================
  return (
    <>
      {/* FILTER */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* SEARCH */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="ค้นหา username หรือชื่อ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 transition-all"
          />
        </div>

        {/* STATUS */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
        >
          <option value="all">🔘 ทุกสถานะ</option>
          <option value="active">✅ Active</option>
          <option value="disabled">🚫 Disabled</option>
        </select>
      </div>

      {/* USER LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h2 className="font-semibold text-gray-800">รหัสพนักงาน</h2>
            {!isLoading && (
              <span className="ml-1 text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                {filteredUsers?.length ?? users.length} คน
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 px-2 py-3 rounded-lg">
                <div className="h-4 bg-gray-100 rounded w-8" />
                <div className="h-4 bg-gray-100 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded w-20" />
                <div className="h-4 bg-gray-100 rounded w-20" />
                <div className="h-4 bg-gray-100 rounded w-16" />
                <div className="h-4 bg-gray-100 rounded w-14" />
                <div className="h-5 bg-gray-100 rounded-full w-11 ml-auto" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            {users.length === 0 ? (
              <>
                <span className="text-4xl mb-3">🙈</span>
                <p className="text-sm">ยังไม่มีพนักงานในระบบ</p>
              </>
            ) : (
              <>
                <span className="text-4xl mb-3">🔍</span>
                <p className="text-sm">ไม่พบผลการค้นหา</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-center font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Username</th>
                  <th className="px-5 py-3 text-left font-semibold">ชื่อ</th>
                  <th className="px-5 py-3 text-left font-semibold">นามสกุล</th>
                  <th className="px-5 py-3 text-center font-semibold">Role</th>
                  <th className="px-5 py-3 text-center font-semibold">สถานะ</th>
                  <th className="px-5 py-3 text-center font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedUsers.map((u, index) => (
                  <tr key={u.id} className="hover:bg-blue-50/40 transition-colors duration-100 group">
                    <td className="px-5 py-3.5 text-center text-gray-400 font-mono text-xs">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-800">{u.username}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{u.first_name}</td>
                    <td className="px-5 py-3.5 text-gray-600">{u.last_name}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        u.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-500"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-400"}`} />
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-center items-center gap-3">
                        {/* Toggle */}
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={u.is_active}
                            onChange={() => toggleActive(u)}
                          />
                          <div className="w-10 h-5 rounded-full bg-gray-200 peer-checked:bg-emerald-500 relative after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-sm after:transition-all peer-checked:after:translate-x-5" />
                        </label>

                        {/* Delete */}
                        <button
                          onClick={() => deleteUser(u)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                          title="ลบพนักงาน"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        {filteredUsers.length > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              แสดง {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredUsers.length)} จาก {filteredUsers.length} คน
            </p>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ◀
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-gray-300 text-sm">···</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                        page === item
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
