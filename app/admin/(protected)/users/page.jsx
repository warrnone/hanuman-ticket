"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";

export default function AdminPage() {
  const router = useRouter();

  // ======================
  // STATE
  // ======================
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [cachedCount, setCachedCount] = useState(3);

  // ======================
  // PAGINATION
  // ======================
  const PAGE_SIZE = 9;
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

  const paginatedUsers = users.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // ======================
  // FETCH USERS
  // ======================
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");

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
    setMounted(true);
    fetchUsers();
  }, []);

  // กัน page เกินหลังลบข้อมูล
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [users.length, totalPages, page]);

  // 🚫 กัน hydration error
  if (!mounted) return null;

  // ======================
  // ADD USER
  // ======================
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      swalError("ข้อมูลไม่ครบ", "กรุณากรอกรหัสพนักงาน");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      const result = await res.json();

      if (!res.ok) {
        swalError("เพิ่มพนักงานไม่สำเร็จ", result.error);
        return;
      }

      setUsername("");
      fetchUsers();
      swalSuccess("บันทึกสำเร็จ", "เพิ่มพนักงานเรียบร้อยแล้ว");
    } catch {
      swalError("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

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
      {/* ADD USER */}
      <form
        onSubmit={handleAddUser}
        className="bg-white p-6 rounded-xl shadow mb-8"
      >
        <h2 className="font-semibold text-lg mb-2">➕ เพิ่มพนักงาน</h2>

        <p className="text-sm text-gray-500 mb-4">
          * รหัสผ่านเริ่มต้นคือ <b>1234</b>
          <br />
          พนักงานต้องเปลี่ยนรหัสเองหลัง Login ครั้งแรก
        </p>

        <input
          className="border rounded px-3 py-2 w-full md:w-1/2"
          placeholder="รหัสพนักงาน (ตัวเลขเท่านั้น)"
          value={username}
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e) =>
            setUsername(e.target.value.replace(/\D/g, ""))
          }
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "กำลังเพิ่ม..." : "Add User"}
        </button>
      </form>

      {/* USER LIST */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold text-lg mb-4">👥 รหัสพนักงาน</h2>

        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="border-x border-b">
                <div className="grid grid-cols-4 gap-3 px-3 py-3 items-center">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-12" />
                  <div className="h-4 bg-gray-200 rounded w-14" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 py-8">ยังไม่มีพนักงาน</p>
        ) : (
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">Username</th>
                <th className="border px-3 py-2">name</th>
                <th className="border px-3 py-2">lastname</th>
                <th className="border px-3 py-2">Role</th>
                <th className="border px-3 py-2">Status</th>
                <th className="border px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr key={u.id}>
                  <td className="border px-3 py-2">{u.username}</td>
                  <td className="border px-3 py-2">{u.first_name}</td>
                  <td className="border px-3 py-2">{u.last_name}</td>
                  <td className="border px-3 py-2">{u.role}</td>
                  <td className="border px-3 py-2">
                    {u.is_active ? "Active" : "Disabled"}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    <div className="flex justify-center gap-3">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={u.is_active}
                          onChange={() => toggleActive(u)}
                        />
                        <div className="w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-green-500 relative after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                      <button
                        onClick={() => deleteUser(u)}
                        className="text-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* PAGINATION */}
        {users.length > PAGE_SIZE && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ◀ ก่อนหน้า
            </button>

            <span className="px-3 py-1">
              หน้า {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ถัดไป ▶
            </button>
          </div>
        )}
      </div>
    </>
  );
}
