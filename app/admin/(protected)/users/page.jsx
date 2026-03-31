"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";
import { Skeleton, Card } from "antd";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  // แก้ internet หลุด
  const [isOffline, setIsOffline] = useState(false);

  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

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

    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const fetchUsers = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);

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
    } catch (err) {
      const offlineNow = typeof navigator !== "undefined" && !navigator.onLine;
      if (offlineNow) return;
      swalError("ไม่สามารถโหลดข้อมูลพนักงานได้");
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateNetworkStatus = () => {
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }
  };

  useEffect(() => {

    updateNetworkStatus();

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!isOffline) {
      fetchUsers();
    }
  }, [isOffline]);


  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [users.length, totalPages, page]);

  const toggleActive = async (user) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      swalError("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
      return;
    }

    if (!user.id) {
      swalError("ไม่พบ User ID");
      return;
    }

    const prev = user.is_active;

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
      const offlineNow = typeof navigator !== "undefined" && !navigator.onLine;
      if (offlineNow) {
        swalError("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
        return;
      }
      setUsers((list) =>
        list.map((u) =>
          u.id === user.id ? { ...u, is_active: prev } : u
        )
      );
      swalError("อัปเดตไม่สำเร็จ");
    }
  };

  const deleteUser = async (user) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      swalError("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
      return;
    }

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
      const offlineNow = typeof navigator !== "undefined" && !navigator.onLine;
      if (offlineNow) {
        swalError("ไม่มีการเชื่อมต่ออินเทอร์เน็ต");
        return;
      }
      swalError("เกิดข้อผิดพลาด");
    }
  };

  // ✅ loading ทั้งหน้า
  if (!mounted || isLoading) {
    return (
      <div className="p-6 space-y-5">

        {/* Filter bar skeleton */}
        <div className="flex gap-3">
          <Skeleton.Input active size="middle" style={{ width: 256, borderRadius: 12 }} />
          <Skeleton.Input active size="middle" style={{ width: 160, borderRadius: 12 }} />
        </div>

        {/* Table card skeleton */}
        <Card
          className="rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          styles={{ body: { padding: 0 } }}
        >
          {/* Card header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Skeleton.Avatar active size={24} shape="circle" />
            <Skeleton.Input active size="small" style={{ width: 120 }} />
            <Skeleton.Button active size="small" shape="round" style={{ width: 44 }} />
          </div>

          {/* Table header row */}
          <div className="grid gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100"
            style={{ gridTemplateColumns: "48px 1fr 1fr 1fr 100px 90px 80px" }}>
            {["w-6", "w-20", "w-16", "w-16", "w-14", "w-14", "w-12"].map((w, i) => (
              <Skeleton.Input
                key={i}
                active
                size="small"
                style={{ width: "100%", maxWidth: ["24px","80px","64px","64px","56px","56px","48px"][i], borderRadius: 4 }}
              />
            ))}
          </div>

          {/* Data rows */}
          <div className="divide-y divide-gray-50">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="grid gap-3 px-6 items-center"
                style={{
                  gridTemplateColumns: "48px 1fr 1fr 1fr 100px 90px 80px",
                  padding: "13px 24px",
                }}
              >
                {/* # */}
                <Skeleton.Input active size="small" style={{ width: 28, borderRadius: 4 }} />

                {/* Username + avatar */}
                <div className="flex items-center gap-2">
                  <Skeleton.Avatar active size={28} shape="circle" />
                  <Skeleton.Input active size="small" style={{ width: "70%", borderRadius: 4 }} />
                </div>

                {/* ชื่อ */}
                <Skeleton.Input active size="small" style={{ width: "65%", borderRadius: 4 }} />

                {/* นามสกุล */}
                <Skeleton.Input active size="small" style={{ width: "60%", borderRadius: 4 }} />

                {/* Role pill */}
                <div className="flex justify-center">
                  <Skeleton.Button active size="small" shape="round" style={{ width: 64 }} />
                </div>

                {/* Status pill */}
                <div className="flex justify-center">
                  <Skeleton.Button active size="small" shape="round" style={{ width: 64 }} />
                </div>

                {/* Actions */}
                <div className="flex justify-center items-center gap-2">
                  <Skeleton.Button active size="small" shape="round" style={{ width: 36 }} />
                  <Skeleton.Button active size="small" shape="square" style={{ width: 20 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    );
  }

  return (
    <>
      {isOffline && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          ไม่มีการเชื่อมต่ออินเทอร์เน็ต ข้อมูลพนักงานอาจไม่อัปเดต และยังไม่สามารถแก้ไขหรือลบได้
        </div>
      )}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="ค้นหา username หรือชื่อ..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
        >
          <option value="all">🔘 ทุกสถานะ</option>
          <option value="active">✅ Active</option>
          <option value="disabled">🚫 Disabled</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h2 className="font-semibold text-gray-800">รหัสพนักงาน</h2>
            <span className="ml-1 text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
              {filteredUsers.length} คน
            </span>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
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
                        <label  className={`inline-flex items-center ${isOffline ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={u.is_active}
                            onChange={() => toggleActive(u)}
                            disabled={isOffline}
                          />
                          <div className="w-10 h-5 rounded-full bg-gray-200 peer-checked:bg-emerald-500 relative after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-sm after:transition-all peer-checked:after:translate-x-5" />
                        </label>

                        <button
                          onClick={() => deleteUser(u)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
                          title="ลบพนักงาน"
                          disabled={isOffline}
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