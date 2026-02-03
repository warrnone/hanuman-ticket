'use client';

import { useEffect, useState } from 'react';
import { swalSuccess, swalError, swalConfirm } from '@/app/components/Swal';

export default function AdminPackagesPage() {
  /* ======================
     STATE
  ====================== */
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 🔹 pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    status: 'active',
    image_url: "",
  });

  /* ======================
     FETCH DATA
  ====================== */
  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/admin/packages');
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);
      setPackages(result.data || []);
    } catch (err) {
      console.error(err);
      swalError('โหลด Packages ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);
      setCategories(result.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchCategories();
  }, []);

  /* ======================
     FILTER
  ====================== */
  const filteredPackages = packages.filter((pkg) => {
    const matchCategory =
      filterCategory === 'all' || pkg.category_id === filterCategory;

    const matchSearch =
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.description || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchCategory && matchSearch;
  });

  // 🔹 pagination logic
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPackages.length / PAGE_SIZE)
  );

  const paginatedPackages = filteredPackages.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* ======================
     HANDLERS
  ====================== */
  const openAdd = () => {
    setEditingId(null);
    setFormData({
      category_id: '',
      name: '',
      description: '',
      price: '',
      status: 'active',
      image_url: '',
    });
    setShowModal(true);
  };

  const openEdit = (pkg) => {
    setEditingId(pkg.id);
    setFormData({
      category_id: pkg.category_id,
      name: pkg.name,
      description: pkg.description ?? '',
      price: pkg.price,
      status: pkg.status,
      image_url: pkg.image_url ?? '', // ✅ โหลดรูปเดิม
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.category_id || !formData.name || !formData.price) {
      swalError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const payload = {
      category_id: formData.category_id,
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.price, 10),
      status: formData.status,
      image_url: formData.image_url,
    };

    if (Number.isNaN(payload.price)) {
      swalError('ราคาต้องเป็นตัวเลขเท่านั้น');
      return;
    }

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/admin/packages/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      swalSuccess('บันทึกสำเร็จ');
      setShowModal(false);
      fetchPackages();
    } catch (err) {
      console.error(err);
      swalError(err.message || 'บันทึกไม่สำเร็จ');
    }
  };

  const handleDelete = async (pkg) => {
    const ok = await swalConfirm(
      'ลบ Package?',
      `ต้องการลบ ${pkg.name} ใช่หรือไม่`
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      swalSuccess('ลบสำเร็จ');
      fetchPackages();
    } catch (err) {
      console.error(err);
      swalError('ลบไม่สำเร็จ');
    }
  };

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
  const handleUploadImage = async (file) => {
    if (!file) return;

    // ✅ ตรวจชนิดไฟล์
    if (!file.type.startsWith("image/")) {
      swalError("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }

    // ✅ ตรวจขนาดไฟล์ (20 MB)
    if (file.size > MAX_FILE_SIZE) {
      swalError("ขนาดไฟล์ต้องไม่เกิน 20 MB");
      return;
    }

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/admin/packages/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setFormData((prev) => ({
        ...prev,
        image_url: data.url,
      }));

      swalSuccess("อัปโหลดรูปสำเร็จ");
    } catch (err) {
      console.error(err);
      swalError("อัปโหลดรูปไม่สำเร็จ");
    }
  };

  /* ======================
     RENDER
  ====================== */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div className="flex gap-2">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
          <div className="w-4 h-4 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        </div>
        <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📦 Package Management</h1>
        <button
          onClick={openAdd}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Package
        </button>
      </div>

      {/* FILTER */}
      <div className="flex gap-4 mb-4">
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="border px-3 py-2 rounded flex-1"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPackages.map((pkg) => (
              <tr key={pkg.id} className="border-t">
                <td className="p-3">{pkg.name}</td>
                <td className="p-3">{pkg.categories?.name || '-'}</td>
                <td className="p-3 font-bold text-orange-600">
                  {pkg.price.toLocaleString()}฿
                </td>
                <td className="p-3">{pkg.status}</td>
                <td className="p-3">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pkg)}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-4 text-sm">
        <span className="text-gray-500">
          Page {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Prev
            </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Next
          </button>
        </div>
      </div>

      {/* MODAL (เดิม) */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className=" bg-white rounded-lg w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Edit Package' : 'Add Package'}
            </h2>

            <div className="space-y-3">
              <select
                value={formData.category_id}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                className="border w-full px-3 py-2 rounded"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Package name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="border w-full px-3 py-2 rounded"
              />

              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border w-full px-3 py-2 rounded"
              />

              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="border w-full px-3 py-2 rounded"
              />

              {/* Upload file  */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Package Image
                </label>

                {/* Upload Area */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e.target.files[0])}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <svg
                      className="w-8 h-8 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">Click to upload image</span>
                    <span className="text-xs text-gray-500 mt-1">Max size: 20 MB</span>
                  </label>
                </div>

                {/* Preview */}
                {formData.image_url && (
                  <div className="relative inline-block">
                    <img
                      src={formData.image_url}
                      alt="preview"
                      className="w-40 h-40 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="border w-full px-3 py-2 rounded"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out"
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
