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

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    status: 'active',
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

  /* ======================
     RENDER
  ====================== */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-6 border border-slate-100">
          
          {/* Animated spinner */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Text */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">กำลังโหลดข้อมูล</h3>
            <p className="text-slate-500 text-sm">กรุณารอสักครู่...</p>
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
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
          onChange={(e) => setFilterCategory(e.target.value)}
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
          onChange={(e) => setSearchTerm(e.target.value)}
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
            {filteredPackages.map((pkg) => (
              <tr key={pkg.id} className="border-t">
                <td className="p-3">{pkg.name}</td>
                <td className="p-3">
                  {pkg.categories?.name || '-'}
                </td>
                <td className="p-3 font-bold text-orange-600">
                  ฿{pkg.price.toLocaleString()}
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    pkg.status === 'active' 
                      ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20' 
                      : 'bg-red-100 text-red-700 ring-1 ring-red-600/20'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      pkg.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {pkg.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => openEdit(pkg)}
                      className="group relative px-3 py-2 bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                    
                    <button
                      onClick={() => handleDelete(pkg)}
                      className="group relative px-3 py-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-sm font-medium">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
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
                className="flex-1 bg-gray-300 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-orange-600 text-white py-2 rounded"
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
