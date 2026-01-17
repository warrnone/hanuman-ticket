'use client';

import { useState } from 'react';

export default function SalePage() {
  const [selectedCategory, setSelectedCategory] = useState('World Packages');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [showSurvey, setShowSurvey] = useState(false);

  // Categories
  const categories = [
    'World Packages',
    'Zipline',
    'Adventures',
    'Luge',
    'Photo & Video',
    'Add-ons'
  ];

  // All packages and activities
  const menuItems = {
    'World Packages': [
      { id: 'wa', name: 'World A+', price: 3490, image: '🌍', description: 'Premium package with all activities' },
      { id: 'wb', name: 'World B+', price: 2990, image: '🌍', description: 'Standard package' },
      { id: 'wc', name: 'World C+', price: 2490, image: '🌍', description: 'Basic package' },
      { id: 'wd', name: 'World D+', price: 1990, image: '🌍', description: 'Entry package' },
      { id: 'dwa', name: 'DWA+', price: 4290, image: '⭐', description: 'Deluxe World A+' },
      { id: 'dwb', name: 'DWB+', price: 3790, image: '⭐', description: 'Deluxe World B+' },
      { id: 'dwc', name: 'DWC+', price: 3290, image: '⭐', description: 'Deluxe World C+' },
      { id: 'dwd', name: 'DWD+', price: 2690, image: '⭐', description: 'Deluxe World D+' },
    ],
    'Zipline': [
      { id: 'z10', name: 'Z10 Platform', price: 1500, image: '🪂', description: '10 platforms zipline course' },
      { id: 'z18', name: 'Z18 Platform', price: 2200, image: '🪂', description: '18 platforms zipline course' },
      { id: 'z32', name: 'Z32 Platform', price: 2900, image: '🪂', description: '32 platforms zipline course' },
    ],
    'Adventures': [
      { id: 'sling', name: 'Sling Shot', price: 350, image: '🎯', description: 'Extreme catapult experience' },
      { id: 'slingpro', name: 'Sling Shot Pro', price: 500, image: '🎯', description: 'Professional sling shot' },
      { id: 'skywalk', name: 'Sky Walk', price: 500, image: '🌉', description: 'Glass bridge adventure' },
      { id: 'roller', name: 'Roller Coaster', price: 1000, image: '🎢', description: 'Mountain roller coaster' },
    ],
    'Luge': [
      { id: 'luge1', name: 'Luge 1 Ride', price: 790, image: '🛼', description: '1 ride down the mountain' },
      { id: 'luge2', name: 'Luge 2 Rides', price: 890, image: '🛼', description: '2 rides package' },
      { id: 'luge3', name: 'Luge 3 Rides', price: 990, image: '🛼', description: '3 rides package' },
      { id: 'lugedouble', name: 'Luge Doubling', price: 390, image: '🛼', description: 'Two-seater luge' },
    ],
    'Photo & Video': [
      { id: 'photo1', name: 'Photo 1 PAX', price: 800, image: '📷', description: 'Professional photos for 1 person' },
      { id: 'photo24', name: 'Photo 2-4 PAX', price: 1200, image: '📷', description: 'Group photos 2-4 people' },
      { id: 'photo57', name: 'Photo 5-7 PAX', price: 1400, image: '📷', description: 'Group photos 5-7 people' },
      { id: 'vidzip', name: 'Video Zipline', price: 1300, image: '🎥', description: '1.30 mins edited video' },
      { id: 'vidroller', name: 'Video Roller', price: 1500, image: '🎥', description: 'GoPro roller video' },
      { id: 'vidluge', name: 'Video Luge', price: 1500, image: '🎥', description: 'GoPro luge video' },
    ],
    'Add-ons': [
      { id: 'insurance', name: 'Insurance', price: 100, image: '🛡️', description: 'Adventure insurance' },
      { id: 'locker', name: 'Locker Rental', price: 50, image: '🔐', description: 'Secure locker' },
      { id: 'lunch', name: 'Lunch Box', price: 250, image: '🍱', description: 'Thai lunch box' },
      { id: 'transfer', name: 'Hotel Transfer', price: 500, image: '🚐', description: 'Round trip transfer' },
    ],
  };

  // Add item to cart
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  // Update quantity
  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = subtotal * 0.05; // 5% discount
  const tax = (subtotal - discount) * 0.07; // 7% VAT
  const total = subtotal - discount + tax;

  // Get current items for selected category
  const currentItems = menuItems[selectedCategory] || [];

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Please add items to cart first!');
      return;
    }
    setShowSurvey(true);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Categories */}
      <div className="w-48 bg-gradient-to-b from-orange-700 to-orange-900 text-white overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-2xl">🐒</span>
            </div>
            <div className="text-sm">
              <div className="font-bold">HANUMAN</div>
              <div className="text-xs">WORLD</div>
            </div>
          </div>
          
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`w-full text-left px-4 py-3 mb-1 rounded transition-colors text-sm ${
                selectedCategory === category
                  ? 'bg-orange-600'
                  : 'hover:bg-orange-800'
              }`}
            >
              {category}
            </button>
          ))}
          
          <button className="w-full text-left px-4 py-3 mb-1 hover:bg-orange-800 rounded mt-4">
            <span className="text-xl">☰</span> Menu
          </button>
        </div>
      </div>

      {/* Main Content - Packages Grid */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="bg-white p-4 shadow-sm border-b">
          <div className="flex items-center justify-between">
            <div className="relative max-w-md flex-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</span>
              <input
                type="text"
                placeholder="Search packages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="ml-4 flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center font-semibold">
                H
              </div>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="CASH">💵 CASH</option>
                <option value="CARD">💳 CARD</option>
                <option value="QR">📱 QR PAY</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Title */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3">
          <h2 className="text-xl font-bold">{selectedCategory}</h2>
        </div>

        {/* Packages Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentItems.map((item) => (
              <div
                key={item.id}
                onClick={() => addToCart(item)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer overflow-hidden border-2 border-transparent hover:border-orange-500"
              >
                <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-7xl">
                  {item.image}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-base mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-600 font-bold text-lg">฿{item.price.toLocaleString()}</span>
                    <button className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
                      <span className="text-xl">+</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-orange-900 text-white py-3 px-6 flex items-center justify-center shadow-lg">
          <span className="text-xl mr-2">🛒</span>
          <span className="font-medium">SALES COUNTER</span>
          <span className="ml-4 bg-orange-600 px-3 py-1 rounded-full text-sm">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </span>
        </div>
      </div>

      {/* Right Sidebar - Cart */}
      <div className="w-96 bg-white shadow-2xl flex flex-col border-l-4 border-orange-500">
        {/* Cart Header */}
        <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                {paymentMethod === 'CASH' ? '💵' : paymentMethod === 'CARD' ? '💳' : '📱'}
              </div>
              <div>
                <div className="font-bold text-gray-800">{paymentMethod}</div>
                <div className="text-xs text-gray-600">Payment Method</div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <span className="text-xl">🔍</span>
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <div className="text-7xl mb-4 opacity-20">🛒</div>
              <p className="text-lg">Cart is empty</p>
              <p className="text-sm mt-2">Select packages to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-orange-300 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{item.image}</span>
                        <h4 className="font-bold text-sm">{item.name}</h4>
                      </div>
                      <p className="text-xs text-gray-500">฿{item.price.toLocaleString()} × {item.quantity}</p>
                      <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">฿{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                      >
                        <span>−</span>
                      </button>
                      <span className="w-12 text-center font-bold text-lg">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-bold"
                      >
                        <span>+</span>
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <span className="text-xl">🗑️</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t-2 p-4 bg-gradient-to-br from-gray-50 to-orange-50">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount (5%):</span>
                <span className="font-medium">-฿{discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT (7%):</span>
                <span className="font-medium">฿{tax.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-orange-200 pt-2 flex justify-between items-center">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-2xl text-orange-600">฿{total.toFixed(2)}</span>
              </div>
              <div className="text-xs text-gray-500 text-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items • {cart.length} packages
              </div>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all shadow-lg transform hover:scale-105"
              >
                💳 CHECKOUT & PAY
              </button>
              <button 
                onClick={() => setCart([])}
                className="w-full bg-gray-200 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                🗑️ Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Survey Modal */}
      {showSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 sticky top-0">
              <h2 className="text-2xl font-bold text-center">Customer Information</h2>
            </div>
            
            <div className="p-6">
              {/* Survey Questions */}
              <div className="mb-6 border-b pb-6">
                <h3 className="font-bold text-lg mb-4 text-center">Please tell us about your experience</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold mb-2 text-sm">How did you hear about us?</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>Select...</option>
                      <option>Social Media</option>
                      <option>Website</option>
                      <option>Friend</option>
                      <option>Hotel</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-sm">How did you come here?</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>Select...</option>
                      <option>Self Drive</option>
                      <option>Hotel Taxi</option>
                      <option>Grab</option>
                      <option>Bolt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-2 text-sm">Why did you choose us?</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                      <option>Select...</option>
                      <option>Service</option>
                      <option>Safety</option>
                      <option>Value</option>
                      <option>Reviews</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block font-semibold mb-2 text-sm">Customer Name:</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Enter name" />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-sm">Phone Number:</label>
                  <input type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Enter phone" />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-sm">Email:</label>
                  <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Enter email" />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-sm">Booking Time:</label>
                  <input type="time" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-orange-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-medium">฿{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t-2 border-orange-200 pt-2 flex justify-between font-bold text-base">
                    <span>Total Amount:</span>
                    <span className="text-orange-600">฿{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSurvey(false)}
                  className="flex-1 bg-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    alert('Payment completed! Thank you for your purchase.');
                    setCart([]);
                    setShowSurvey(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 rounded-lg hover:from-orange-600 hover:to-red-600"
                >
                  Complete Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}