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
      setUsers(data);
    } catch (err) {
      swalError("ไม่สามารถโหลดข้อมูลพนักงานได้");
    }
  };

  // ======================
  // GUARD + LOAD
  // ======================
  useEffect(() => {
    fetchUsers();
  }, []);

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
        body: JSON.stringify({
          username: username.trim(),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        swalError("เพิ่มพนักงานไม่สำเร็จ", result.error);
        return;
      }

      setUsername("");
      fetchUsers();
      swalSuccess("บันทึกสำเร็จ", "เพิ่มพนักงานเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
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

      // console.log(res); return
      

      if (!res.ok) {
        throw new Error("update failed");
      }
      swalSuccess(
        "อัปเดตสำเร็จ",
        user.is_active ? "ปิดการใช้งานแล้ว" : "เปิดการใช้งานแล้ว"
      );
    } catch (err) {
      setUsers((list) =>
        list.map((u) =>
          u.id === user.id ? { ...u, is_active: prev } : u
        )
      );
      swalError("อัปเดตไม่สำเร็จ");
    }
  };


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
    } catch (err) {
      swalError("เกิดข้อผิดพลาด");
    }
  };

  // ======================
  // UI
  // ======================
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          👑 Admin Dashboard
        </h1>

        {/* ======================
            ADD USER FORM
        ====================== */}
        <form
          onSubmit={handleAddUser}
          className="bg-white p-6 rounded-xl shadow mb-8"
        >
          <h2 className="font-semibold text-lg mb-2">
            ➕ เพิ่มพนักงาน
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            * รหัสผ่านเริ่มต้นคือ <b>1234</b><br />
            พนักงานต้องเปลี่ยนรหัสเองหลัง Login ครั้งแรก
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border rounded px-3 py-2"
              placeholder="รหัสพนักงาน (Username)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "กำลังเพิ่ม..." : "Add User"}
          </button>
        </form>

        {/* ======================
            USER LIST
        ====================== */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-semibold text-lg mb-4">
            👥 รหัสพนักงาน
          </h2>

          {users.length === 0 ? (
            <p className="text-gray-500">
              ยังไม่มีพนักงาน
            </p>
          ) : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2">Username</th>
                  <th className="border px-3 py-2">Role</th>
                  <th className="border px-3 py-2">Status</th>
                  <th className="border px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="border px-3 py-2">
                      {u.username}
                    </td>
                    <td className="border px-3 py-2">
                      {u.role}
                    </td>
                    <td className="border px-3 py-2">
                      {u.is_active ? "Active" : "Disabled"}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* Toggle Active */}
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={u.is_active}
                            onChange={() => toggleActive(u)}
                          />
                          <div
                            className="
                              w-11 h-6 rounded-full
                              bg-gray-300
                              peer-checked:bg-green-500
                              relative
                              after:content-['']
                              after:absolute
                              after:top-0.5
                              after:left-0.5
                              after:w-5
                              after:h-5
                              after:bg-white
                              after:rounded-full
                              after:transition-all
                              peer-checked:after:translate-x-5
                            "
                          />
                        </label>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteUser(u)}
                          className="text-red-600 hover:text-red-800 text-sm"
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
          )}
        </div>

      </div>
    </div>
  );
}
