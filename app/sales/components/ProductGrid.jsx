"use client";

export default function ProductGrid({ title, items, onAdd }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onAdd(item)}
              className="bg-white rounded-xl shadow hover:shadow-xl transition cursor-pointer border-2 border-transparent hover:border-orange-500"
            >
              <div className="aspect-square bg-orange-100 flex items-center justify-center text-6xl">
                {item.image}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm">{item.name}</h3>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-orange-600 font-bold">
                    ฿{item.price.toLocaleString()}
                  </span>
                  <button className="bg-orange-500 text-white w-8 h-8 rounded-full">
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
