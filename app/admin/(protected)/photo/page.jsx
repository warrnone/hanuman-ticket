'use client';

import { useEffect, useState } from 'react';
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";

export default function AdminPhotoVideoPage() {
  /* =========================
     STATE
  ========================= */
  const [photoRules, setPhotoRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    activity_category_id: '',
    media_type: '',
    video_type: '',
    duration_value: '',
    duration_unit: 'sec',
    pax_min: '',
    pax_max: '',
    price: '',
    status: 'active',
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    fetchRules();
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedCategoryId]);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/admin/photo-video');
      const json = await res.json();
      setPhotoRules(json.data || []);
    } catch (err) {
      console.error(err);
      swalError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories');
    const json = await res.json();
    setCategories(json.data || []);
  };

  /* =========================
     FORM
  ========================= */
  const resetForm = () => {
    setFormData({
      activity_category_id: '',
      media_type: '',
      video_type: '',
      duration_value: '',
      duration_unit: 'sec',
      pax_min: '',
      pax_max: '',
      price: '',
      status: 'active',
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    let res;

    if (!formData.activity_category_id || !formData.media_type || !formData.price) {
      swalError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    const payload = {
      activity_category_id: formData.activity_category_id,
      media_type: formData.media_type,
      pax_min: parseInt(formData.pax_min, 10),
      pax_max: parseInt(formData.pax_max, 10),
      price: parseInt(formData.price, 10),
      status: formData.status ?? "active",
    };

    if (
      Number.isNaN(payload.price) ||
      Number.isNaN(payload.pax_min) ||
      Number.isNaN(payload.pax_max)
    ) {
      swalError("กรุณากรอกตัวเลขจำนวนเต็มเท่านั้น");
      return;
    }

    if (formData.media_type === "video") {
      if (!formData.video_type || !formData.duration_value || !formData.duration_unit) {
        swalError("กรุณากรอกข้อมูลวิดีโอให้ครบ");
        return;
      }

      payload.video_type = formData.video_type;
      payload.duration_value = parseInt(formData.duration_value, 10);
      payload.duration_unit = formData.duration_unit;
    }

    try {
      res = await fetch(
        editingId
          ? `/api/admin/photo-video/${editingId}`
          : `/api/admin/photo-video`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        swalError(result.error || "Save failed");
        return; // ⭐ สำคัญมาก
      }

      setShowModal(false);
      resetForm();
      fetchRules();
      swalSuccess("บันทึกสำเร็จ");
    } catch (err) {
      console.error("Save error:", err);
      swalError("บันทึกข้อมูลไม่สำเร็จ", err.message);
    }
  };


  const handleEdit = rule => {
    setEditingId(rule.id);
    setFormData({
      activity_category_id: rule.activity_category_id,
      media_type: rule.media_type,
      video_type: rule.video_type || '',
      duration_value: rule.duration_value || '',
      duration_unit: rule.duration_unit || 'sec',
      pax_min: rule.pax_min,
      pax_max: rule.pax_max,
      price: rule.price,
      status: rule.status,
    });
    setShowModal(true);
  };

  const handleDelete = async id => {
    const result = await swalConfirm("ลบรายการนี้หรือไม่?");
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/admin/photo-video/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      swalError("ไม่สามารถลบข้อมูลได้");
      return;
    }

    fetchRules();
    swalSuccess("ลบสำเร็จ");
  };

  /* =========================
     FILTER + PAGINATION
  ========================= */
  const filteredRules = selectedCategoryId
    ? photoRules.filter(
        r =>
          r.activity_category_id === selectedCategoryId ||
          r.categories?.id === selectedCategoryId
      )
    : photoRules;

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / PAGE_SIZE));

  const paginatedRules = filteredRules.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">📷 Photo & Video Pricing</h1>
            <p className="text-purple-100 text-sm">
              Manage photo & video price by activity, pax & duration
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold"
          >
            + Add Price Rule
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <select
          className="border p-2 rounded min-w-[220px]"
          value={selectedCategoryId}
          onChange={e => setSelectedCategoryId(e.target.value)}
        >
          <option value="">All Activities</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center p-10 space-x-2">
            <span className="sr-only">Loading...</span>
            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Activity</th>
                <th className="p-3 text-left">Detail</th>
                <th className="p-3 text-left">PAX</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRules.map(rule => (
                <tr key={rule.id} className="border-t">
                  <td className="p-3">{rule.categories?.name}</td>
                  <td className="p-3 text-gray-600">
                    {rule.media_type === "photo"
                      ? "Photo"
                      : `${rule.video_type} • ${rule.duration_value} ${rule.duration_unit}`}
                  </td>
                  <td className="p-3">{rule.pax_min} – {rule.pax_max}</td>
                  <td className="p-3 font-bold text-purple-600">
                    ฿{Number(rule.price).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(rule)}
                        className="px-5 py-2 text-sm font-medium tracking-wide text-blue-600 bg-transparent border border-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="px-5 py-2 text-sm font-medium tracking-wide text-red-600 bg-transparent border border-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center p-4 text-sm">
        <span>Page {page} / {totalPages}</span>
        <div className="flex gap-2">
          <div className="flex items-center gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all active:scale-95 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Previous
            </button>

            <span className="text-sm text-gray-600 font-medium">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all active:scale-95 flex items-center gap-2"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => { setShowModal(false); resetForm(); }}
        >
          <div
            className="bg-white rounded-xl w-full max-w-lg p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Edit Price Rule" : "Add Price Rule"}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <select
                className="border p-2 rounded"
                value={formData.activity_category_id}
                onChange={e => setFormData({ ...formData, activity_category_id: e.target.value })}
              >
                <option value="">Select Activity</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                className="border p-2 rounded"
                value={formData.media_type}
                onChange={e => setFormData({ ...formData, media_type: e.target.value })}
              >
                <option value="">Select Type</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
              </select>

              {formData.media_type === "video" && (
                <>
                  <select
                    className="border p-2 rounded"
                    value={formData.video_type}
                    onChange={e => setFormData({ ...formData, video_type: e.target.value })}
                  >
                    <option value="">Video Type</option>
                    <option value="edit">Edit</option>
                    <option value="reel">Reel</option>
                    <option value="gopro">GoPro</option>
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Duration"
                      className="border p-2 rounded w-full"
                      value={formData.duration_value}
                      onChange={e => setFormData({ ...formData, duration_value: e.target.value })}
                    />
                    <select
                      className="border p-2 rounded"
                      value={formData.duration_unit}
                      onChange={e => setFormData({ ...formData, duration_unit: e.target.value })}
                    >
                      <option value="sec">sec</option>
                      <option value="min">min</option>
                      <option value="round">round</option>
                      <option value="video">video</option>
                    </select>
                  </div>
                </>
              )}

              <input
                type="number"
                placeholder="PAX Min"
                className="border p-2 rounded"
                value={formData.pax_min}
                onChange={e => setFormData({ ...formData, pax_min: e.target.value })}
              />

              <input
                type="number"
                placeholder="PAX Max"
                className="border p-2 rounded"
                value={formData.pax_max}
                onChange={e => setFormData({ ...formData, pax_max: e.target.value })}
              />

              <input
                type="number"
                placeholder="Price"
                className="border p-2 rounded col-span-2"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-purple-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
 