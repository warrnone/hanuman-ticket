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
    base_price: '',
    extra_pax_price: '',
    status: 'active',
    image_url: '',
    sale_mode: 'single',
    media_package: 'photo',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
      base_price: '',
      extra_pax_price: '',
      status: 'active',
      image_url: '',
      sale_mode: 'single',
      media_package: 'photo',
    });
    setEditingId(null);
  };

  // Helper map
  const normalizeMediaFields = (formData) => {
    if (formData.media_package === "photo") {
      return {
        media_package: "photo",
        media_type: "photo",
        sale_mode:
          formData.sale_mode === "set" || formData.sale_mode === "first_next"
            ? formData.sale_mode
            : "single",
        video_type: null,
        duration_value: null,
        duration_unit: null,
      };
    }

    if (formData.media_package === "video") {
      return {
        media_package: "video",
        media_type: "video",
        sale_mode:
          formData.sale_mode === "first_next" || formData.sale_mode === "set"
            ? formData.sale_mode
            : "single",
        video_type: formData.video_type || null,
        duration_value:
          formData.duration_value !== ""
            ? parseInt(formData.duration_value, 10)
            : null,
        duration_unit: formData.duration_unit || null,
      };
    }

    // photo + video set
    return {
      media_package: "photo_video",
      media_type: "video", // ใช้ convention นี้ไปก่อน เพราะ DB ยังรับแค่ photo/video
      sale_mode: "set",    // บังคับให้เป็น set
      video_type: null,
      duration_value: null,
      duration_unit: null,
    };
  };

  const handleSave = async () => {
    let res;

    if (!formData.activity_category_id || !formData.media_package) {
      swalError("กรุณาเลือก Activity และ Media Package");
      return;
    }

    const paxMin = parseInt(formData.pax_min, 10);
    const paxMax = parseInt(formData.pax_max, 10);

    if (Number.isNaN(paxMin) || Number.isNaN(paxMax)) {
      swalError("กรุณากรอก PAX Min / PAX Max เป็นตัวเลขจำนวนเต็ม");
      return;
    }

    if (paxMin > paxMax) {
      swalError("PAX Min ต้องไม่มากกว่า PAX Max");
      return;
    }

    const normalized = normalizeMediaFields(formData);

    if (
      normalized.media_package === "photo_video" &&
      normalized.sale_mode !== "set"
    ) {
      swalError("Photo + Video Set ต้องใช้ Set Price เท่านั้น");
      return;
    }

    const payload = {
      activity_category_id: formData.activity_category_id,
      media_type: normalized.media_type,
      media_package: normalized.media_package,
      sale_mode: normalized.sale_mode,
      pax_min: paxMin,
      pax_max: paxMax,
      status: formData.status ?? "active",
    };

    /* =========================
      VIDEO DETAIL
      ใช้เฉพาะ media_package = video
    ========================= */
    if (normalized.media_package === "video") {
      if (
        !formData.video_type ||
        formData.duration_value === "" ||
        !formData.duration_unit
      ) {
        swalError("กรุณากรอกข้อมูลวิดีโอให้ครบ");
        return;
      }

      const durationValue = parseInt(formData.duration_value, 10);

      if (Number.isNaN(durationValue) || durationValue <= 0) {
        swalError("กรุณากรอก Duration ให้ถูกต้อง");
        return;
      }

      payload.video_type = formData.video_type;
      payload.duration_value = durationValue;
      payload.duration_unit = formData.duration_unit;
    } else {
      payload.video_type = null;
      payload.duration_value = null;
      payload.duration_unit = null;
    }

    /* =========================
      PRICING MODEL
    ========================= */
    if (normalized.sale_mode === "first_next") {
      const basePrice = parseInt(formData.base_price, 10);
      const extraPaxPrice = parseInt(formData.extra_pax_price, 10);

      if (Number.isNaN(basePrice) || Number.isNaN(extraPaxPrice)) {
        swalError("กรุณากรอก First Person Price และ Next Person Price");
        return;
      }

      if (basePrice < 0 || extraPaxPrice < 0) {
        swalError("ราคา First / Next ต้องมากกว่าหรือเท่ากับ 0");
        return;
      }

      payload.base_price = basePrice;
      payload.extra_pax_price = extraPaxPrice;
      payload.price = null;
    } else {
      const price = parseInt(formData.price, 10);

      if (Number.isNaN(price)) {
        swalError("กรุณากรอกราคาให้ถูกต้อง");
        return;
      }

      if (price < 0) {
        swalError("ราคาต้องมากกว่าหรือเท่ากับ 0");
        return;
      }

      payload.price = price;
      payload.base_price = null;
      payload.extra_pax_price = null;
    }

    try {
      let imageUrl = formData.image_url || null;

      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);

        const uploadRes = await fetch("/api/admin/photo-video/upload", {
          method: "POST",
          body: fd,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          swalError(uploadData.error || "Upload failed");
          return;
        }

        imageUrl = uploadData.url;
      }

      payload.image_url = imageUrl;

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
        return;
      }

      setShowModal(false);
      resetForm();
      setImageFile(null);
      setImagePreview(null);
      fetchRules();
      swalSuccess("บันทึกสำเร็จ");
    } catch (err) {
      console.error("Save error:", err);
      swalError("บันทึกข้อมูลไม่สำเร็จ", err.message);
    }
  };

  const handleEdit = (rule) => {
    setEditingId(rule.id);
    setFormData({
      activity_category_id: rule.activity_category_id,
      media_type: rule.media_type,
      video_type: rule.video_type || '',
      duration_value: rule.duration_value || '',
      duration_unit: rule.duration_unit || 'sec',
      pax_min: rule.pax_min,
      pax_max: rule.pax_max,
      price: rule.price ?? '',
      base_price: rule.base_price ?? '',
      extra_pax_price: rule.extra_pax_price ?? '',
      status: rule.status,
      image_url: rule.image_url || '',
      sale_mode: rule.sale_mode || 'single',
      media_package: rule.media_package || rule.media_type || 'photo',
    });
    setImagePreview(rule.image_url || null);
    setImageFile(null);
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
  const filteredRules = selectedCategoryId ? photoRules.filter(r => r.activity_category_id === selectedCategoryId || r.categories?.id === selectedCategoryId) : photoRules;
  const totalPages = Math.max(1, Math.ceil(filteredRules.length / PAGE_SIZE));
  const paginatedRules = filteredRules.slice( (page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
                <th className="p-3 text-left">ลำดับ</th>
                <th className="p-3 text-left">Activity</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">PAX</th>
                <th className="p-3 text-left">Sale mode</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRules.map((rule , index) => (
                <tr key={rule.id} className="border-t">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{rule.categories?.name}</td>
                  <td className="p-3 text-gray-600">
                    {rule.media_package === "photo_video"
                      ? "photo + video set"
                      : rule.media_package || rule.media_type}
                  </td>
                  <td className="p-3">{rule.pax_min} – {rule.pax_max}</td>
                  <td className="p-3 font-bold text-purple-600">{rule.sale_mode}</td>
                  <td className="p-3">
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
            <div className="flex items-center justify-center gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="group px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm transition-all duration-200 flex items-center gap-2"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="group-hover:-translate-x-1 transition-transform duration-200"
                >
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Previous
              </button>

              <div className="px-4 py-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl shadow-sm">
                <span className="text-sm font-bold text-orange-700">
                  Page <span className="text-lg">{page}</span> of {totalPages}
                </span>
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="group px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm transition-all duration-200 flex items-center gap-2"
              >
                Next
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="group-hover:translate-x-1 transition-transform duration-200"
                >
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <h2 className="text-2xl font-bold">
                {editingId ? "Edit Price Rule" : "Add Price Rule"}
              </h2>
              <p className="text-sm text-purple-100 mt-1">
                Configure media package, pricing mode and upload preview
              </p>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
              {/* Basic Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Activity */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Activity
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                      value={formData.activity_category_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          activity_category_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Activity</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Media Package */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Media Package
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                      value={formData.media_package}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (value === "photo") {
                          setFormData({
                            ...formData,
                            media_package: "photo",
                            media_type: "photo",
                            sale_mode:
                              formData.sale_mode === "set" ||
                              formData.sale_mode === "first_next"
                                ? formData.sale_mode
                                : "single",
                            video_type: "",
                            duration_value: "",
                            duration_unit: "sec",
                          });
                          return;
                        }

                        if (value === "video") {
                          setFormData({
                            ...formData,
                            media_package: "video",
                            media_type: "video",
                            sale_mode:
                              formData.sale_mode === "first_next" ||
                              formData.sale_mode === "set" ||
                              formData.sale_mode === "single"
                                ? formData.sale_mode
                                : "single",
                            video_type: formData.video_type || "",
                            duration_value: formData.duration_value || "",
                            duration_unit: formData.duration_unit || "sec",
                          });
                          return;
                        }

                        setFormData({
                          ...formData,
                          media_package: "photo_video",
                          media_type: "video", // ใช้ convention นี้ไปก่อน เพราะ DB ยังรับแค่ photo/video
                          sale_mode: "set",
                          video_type: "",
                          duration_value: "",
                          duration_unit: "sec",
                        });
                      }}
                    >
                      <option value="photo">📷 Photo</option>
                      <option value="video">🎥 Video</option>
                      <option value="photo_video">🎞 Photo + Video Set</option>
                    </select>

                    {formData.media_package === "photo_video" && (
                      <p className="mt-2 text-xs text-purple-600 font-medium">
                        Photo + Video Set จะถูกบันทึกเป็น Set Price เท่านั้น
                      </p>
                    )}
                  </div>

                  {/* Pricing Model */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Pricing Model
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      value={formData.sale_mode}
                      disabled={formData.media_package === "photo_video"}
                      onChange={(e) =>
                        setFormData({ ...formData, sale_mode: e.target.value })
                      }
                    >
                      <option value="single">Single Price</option>
                      <option value="set">Set Price</option>
                      <option value="first_next">First Person + Next Person</option>
                    </select>

                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
                      {formData.media_package === "photo_video" ? (
                        <>
                          <p className="font-semibold text-slate-700">
                            🎞 Photo + Video Set
                          </p>
                          <p>ขายเป็นชุด ราคาเดียวทั้งแพ็ก</p>
                          <p className="text-orange-600">
                            ตัวอย่าง: Set 1,500฿ → ได้ทั้ง Photo + Video ในราคาเดียว
                          </p>
                        </>
                      ) : formData.sale_mode === "first_next" ? (
                        <>
                          <p className="font-semibold text-slate-700">
                            📌 First Person + Next Person
                          </p>
                          <p>คนแรกคิดราคาหนึ่ง คนถัดไปคิดอีกราคาหนึ่ง</p>
                          <p className="text-orange-600">
                            ตัวอย่าง: First 800฿, Next 200฿ → 3 คน = 800 + 200 + 200 ={" "}
                            <strong>1,200฿</strong>
                          </p>
                        </>
                      ) : formData.sale_mode === "set" ? (
                        <>
                          <p className="font-semibold text-slate-700">📌 Set Price</p>
                          <p>ราคาเหมาจ่ายทั้งกลุ่ม ไม่ว่าจะกี่คนก็จ่ายเท่ากัน</p>
                          <p className="text-orange-600">
                            ตัวอย่าง: Set 1,500฿ → 1 คน หรือ 5 คน จ่ายเท่ากัน
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-slate-700">
                            📌 Single Price
                          </p>
                          <p>ราคาต่อคน คูณด้วยจำนวนผู้เข้าร่วม</p>
                          <p className="text-orange-600">
                            ตัวอย่าง: 500฿/คน → 3 คน = <strong>1,500฿</strong>
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Status
                    </label>
                    <select
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Video Details */}
              {formData.media_package === "video" && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">
                    Video Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Video Type
                      </label>
                      <select
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                        value={formData.video_type}
                        onChange={(e) =>
                          setFormData({ ...formData, video_type: e.target.value })
                        }
                      >
                        <option value="">Select Video Type</option>
                        <option value="edit">Edit</option>
                        <option value="reel">Reel</option>
                        <option value="gopro">GoPro</option>
                        <option value="phone_mount">Phone Mount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Duration
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Duration"
                          className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          value={formData.duration_value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              duration_value: e.target.value,
                            })
                          }
                        />
                        <select
                          className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                          value={formData.duration_unit}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              duration_unit: e.target.value,
                            })
                          }
                        >
                          <option value="sec">sec</option>
                          <option value="min">min</option>
                          <option value="round">round</option>
                          <option value="video">video</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAX + Pricing */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">
                  PAX & Pricing
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PAX Min */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      PAX Min
                    </label>
                    <input
                      type="number"
                      placeholder="Minimum pax"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                      value={formData.pax_min}
                      onChange={(e) =>
                        setFormData({ ...formData, pax_min: e.target.value })
                      }
                    />
                  </div>

                  {/* PAX Max */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      PAX Max
                    </label>
                    <input
                      type="number"
                      placeholder="Maximum pax"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                      value={formData.pax_max}
                      onChange={(e) =>
                        setFormData({ ...formData, pax_max: e.target.value })
                      }
                    />
                  </div>

                  {/* Pricing UI */}
                  {formData.sale_mode === "first_next" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          First Person Price
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 800"
                          className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                          value={formData.base_price || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              base_price: e.target.value,
                              price: "",
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Next Person Price
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 200"
                          className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                          value={formData.extra_pax_price || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              extra_pax_price: e.target.value,
                              price: "",
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Price
                      </label>
                      <input
                        type="number"
                        placeholder={
                          formData.media_package === "photo_video"
                            ? "Enter set price for Photo + Video"
                            : "Enter package price"
                        }
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: e.target.value,
                            base_price: "",
                            extra_pax_price: "",
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  {formData.media_package === "photo_video" ? (
                    <p>
                      Photo + Video Set ใช้ราคาชุดเดียว เหมาะสำหรับการขายแบบ bundle
                    </p>
                  ) : formData.sale_mode === "first_next" ? (
                    <p>
                      Example: first person 800฿, next person 200฿ → 3 pax = 800 + 200
                      + 200
                    </p>
                  ) : formData.sale_mode === "set" ? (
                    <p>
                      Set pricing is ideal for grouped package pricing where total
                      price stays the same.
                    </p>
                  ) : (
                    <p>
                      Single pricing is ideal for standard photo or video package
                      rules.
                    </p>
                  )}
                </div>
              </div>

              {/* Upload */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">
                  Preview Media
                </h3>

                {imagePreview && (
                  <div className="relative mb-4">
                    {imageFile?.type?.startsWith("video/") ? (
                      <video
                        src={imagePreview}
                        className="w-full h-48 object-cover rounded-xl border"
                        controls
                        muted
                      />
                    ) : (
                      <img
                        src={imagePreview}
                        className="w-full h-48 object-cover rounded-xl border"
                        alt="preview"
                      />
                    )}
                  </div>
                )}

                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Image / Video
                </label>

                <input
                  type="file"
                  accept="image/*,video/mp4"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const isImage = file.type.startsWith("image/");
                    const isVideo = file.type.startsWith("video/");

                    if (!isImage && !isVideo) {
                      swalError("รองรับเฉพาะไฟล์รูปภาพ หรือ วิดีโอเท่านั้น");
                      return;
                    }

                    if (isVideo && file.type !== "video/mp4") {
                      swalError("รองรับเฉพาะไฟล์วิดีโอ .mp4 เท่านั้น");
                      return;
                    }

                    const MAX_IMAGE = 5 * 1024 * 1024;
                    const MAX_VIDEO = 10 * 1024 * 1024;

                    if (isImage && file.size > MAX_IMAGE) {
                      swalError("รูปภาพต้องไม่เกิน 5MB");
                      return;
                    }

                    if (isVideo && file.size > MAX_VIDEO) {
                      swalError("วิดีโอต้องไม่เกิน 10MB");
                      return;
                    }

                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                  className="block w-full text-sm border border-dashed border-slate-300 rounded-xl p-3 bg-white"
                />

                <div className="mt-3 text-xs text-slate-500 space-y-1">
                  <div>📷 Image: JPG / PNG / WEBP (Max 5 MB)</div>
                  <div>🎥 Video: MP4 only (Max 10 MB)</div>
                  <div>🎞 Recommended: 720p resolution</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:opacity-95 transition shadow"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
 