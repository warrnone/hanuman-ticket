'use client';

import { useState } from 'react';

export default function AdminPackagesPage() {
  // Mock data - ในระบบจริงจะดึงจาก API/Database
  const [packages, setPackages] = useState([
    { id: 1, category: 'World Packages', name: 'World A+', price: 3490, emoji: '🌍', status: 'active', description: 'Premium package with all activities' },
    { id: 2, category: 'World Packages', name: 'World B+', price: 2990, emoji: '🌍', status: 'active', description: 'Standard package' },
    { id: 3, category: 'World Packages', name: 'World C+', price: 2490, emoji: '🌍', status: 'active', description: 'Basic package' },
    { id: 4, category: 'Zipline', name: 'Z10 Platform', price: 1500, emoji: '🪂', status: 'active', description: '10 platforms zipline course' },
    { id: 5, category: 'Zipline', name: 'Z18 Platform', price: 2200, emoji: '🪂', status: 'active', description: '18 platforms zipline course' },
    { id: 6, category: 'Adventures', name: 'Sling Shot', price: 350, emoji: '🎯', status: 'active', description: 'Extreme catapult experience' },
    { id: 7, category: 'Luge', name: 'Luge 1 Ride', price: 790, emoji: '🛼', status: 'active', description: '1 ride down the mountain' },
    { id: 8, category: 'Photo & Video', name: 'Photo 1 PAX', price: 800, emoji: '📷', status: 'active', description: 'Professional photos for 1 person' },
  ]);

  const [categories, setCategories] = useState([
    'World Packages',
    'Zipline',
    'Adventures',
    'Luge',
    'Photo & Video',
    'Add-ons'
  ]);

  const [editingId, setEditingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    category: '',
    name: '',
    price: '',
    emoji: '',
    description: '',
    status: 'active'
  });

  // Filter packages
  const filteredPackages = packages.filter(pkg => {
    const matchCategory = filterCategory === 'all' || pkg.category === filterCategory;
    const matchSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Handle edit
  const handleEdit = (pkg) => {
    setEditingId(pkg.id);
    setFormData({
      category: pkg.category,
      name: pkg.name,
      price: pkg.price,
      emoji: pkg.emoji,
      description: pkg.description,
      status: pkg.status
    });
  };

  // Handle save edit
  const handleSaveEdit = () => {
    setPackages(packages.map(pkg => 
      pkg.id === editingId 
        ? { ...pkg, ...formData, price: parseFloat(formData.price) }
        : pkg
    ));
    setEditingId(null);
    setFormData({ category: '', name: '', price: '', emoji: '', description: '', status: 'active' });
  };

  // Handle add new package
  const handleAddPackage = () => {
    const newPackage = {
      id: Math.max(...packages.map(p => p.id)) + 1,
      ...formData,
      price: parseFloat(formData.price)
    };
    setPackages([...packages, newPackage]);
    setShowAddModal(false);
    setFormData({ category: '', name: '', price: '', emoji: '', description: '', status: 'active' });
  };

  // Handle delete
  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this package?')) {
      setPackages(packages.filter(pkg => pkg.id !== id));
    }
  };

  // Toggle status
  const toggleStatus = (id) => {
    setPackages(packages.map(pkg => 
      pkg.id === id 
        ? { ...pkg, status: pkg.status === 'active' ? 'inactive' : 'active' }
        : pkg
    ));
  };

  // Statistics
  const stats = {
    total: packages.length,
    active: packages.filter(p => p.status === 'active').length,
    inactive: packages.filter(p => p.status === 'inactive').length,
    totalValue: packages.reduce((sum, p) => sum + p.price, 0)
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🐒</span>
              <div>
                <h1 className="text-3xl font-bold">Package Management</h1>
                <p className="text-orange-100 text-sm">Hanuman World Admin System</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-orange-50 transition-colors flex items-center gap-2"
            >
              <span className="text-xl">+</span> Add New Package
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Packages</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Value</p>
                <p className="text-2xl font-bold text-orange-600">฿{stats.totalValue.toLocaleString()}</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search packages..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Packages Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    {editingId === pkg.id ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={formData.emoji}
                              onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                              className="w-12 px-2 py-1 border rounded text-center"
                              maxLength={2}
                            />
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="flex-1 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({...formData, price: e.target.value})}
                            className="w-24 px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{pkg.emoji}</span>
                            <div className="font-medium text-gray-900">{pkg.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            {pkg.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {pkg.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-orange-600">
                            ฿{pkg.price.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleStatus(pkg.id)}
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              pkg.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {pkg.status === 'active' ? '✓ Active' : '✕ Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(pkg)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(pkg.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPackages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-lg">No packages found</p>
              <p className="text-sm mt-2">Try adjusting your filters or add a new package</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Add New Package</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emoji</label>
                  <input
                    type="text"
                    value={formData.emoji}
                    onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                    placeholder="🎯"
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-2xl"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Package Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter package name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter package description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (THB)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ category: '', name: '', price: '', emoji: '', description: '', status: 'active' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPackage}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-lg hover:from-orange-600 hover:to-red-600"
                >
                  Add Package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}