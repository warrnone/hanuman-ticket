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
    pax_min: '',
    pax_max: '',
    price: '',
    status: 'active',
  });

  const [categories, setCategories] = useState([]);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    fetchRules();
    fetchCategories();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/admin/photo-video');
      const json = await res.json();
      setPhotoRules(json.data || []);
    } catch (err) {
      console.error(err);
      alert('โหลดข้อมูลไม่สำเร็จ');
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
      pax_min: '',
      pax_max: '',
      price: '',
      status: 'active',
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.activity_category_id || !formData.media_type || !formData.price) {
      swalError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const payload = {
      activity_category_id: formData.activity_category_id,
      media_type: formData.media_type,
      pax_min: Number(formData.pax_min),
      pax_max: Number(formData.pax_max),
      price: Number(formData.price),
      status: formData.status,
    };

    try {
      if (editingId) {
        await fetch(`/api/admin/photo-video/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/admin/photo-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      resetForm();
      fetchRules();
      swalSuccess('บันทึกสำเร็จ', 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว');
    } catch (err) {
      console.error(err);
      alert('บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const handleEdit = rule => {
    setEditingId(rule.id);
    setFormData({
      activity_category_id: rule.categories.id,
      media_type: rule.media_type,
      pax_min: rule.pax_min,
      pax_max: rule.pax_max,
      price: rule.price,
      status: rule.status,
    });
    setShowModal(true);
  };

  const handleDelete = async id => {
    const result = await swalConfirm(
      "ลบรายการนี้หรือไม่?",
      `ต้องการลบถาวรหรือไม่`
    );

    if (!result.isConfirmed) return;

    let res = await fetch(`/api/admin/photo-video/${id}`, { method: 'DELETE' });
    
    if(res.status !== 200){
      swalError("เกิดข้อผิดพลาด", "ไม่สามารถลบข้อมูลได้ในขณะนี้");
      return;
    }
    fetchRules();
    swalSuccess("ลบสำเร็จ", "ข้อมูลถูกลบออกจากระบบแล้ว");
  };

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
              Manage photo & video price by activity and pax
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

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 rounded-full blur-sm border-t-blue-400 animate-spin"></div>
            </div>
            <span className="mt-4 text-gray-400 italic text-sm">Please wait...</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Activity</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">PAX</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {photoRules.map(rule => (
                <tr key={rule.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{rule.categories?.name}</td>
                  <td className="p-3 capitalize">{rule.media_type}</td>
                  <td className="p-3">
                    {rule.pax_min} – {rule.pax_max}
                  </td>
                  <td className="p-3 font-bold text-purple-600">
                    ฿{Number(rule.price).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      rule.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {rule.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-sm font-medium hover:bg-blue-600 hover:text-white transition-colors duration-200 mr-2"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-medium hover:bg-red-600 hover:text-white transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Price Rule' : 'Add Price Rule'}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
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

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-purple-600 text-white rounded"
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
