"use client";

export default function ProductGrid({ title, items, onAdd }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ✅ Tablet-first grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onAdd(item)}
              className={`
                bg-white rounded-2xl shadow-md
                hover:shadow-xl transition
                cursor-pointer border
                active:scale-[0.98]
              `}
            >
              {/* IMAGE */}
              <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center rounded-t-2xl overflow-hidden">
                {typeof item.image === "string" && item.image.startsWith("http") ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-6xl">{item.image}</span>
                )}
              </div>

              {/* INFO */}
              <div className="p-4">
                <h3 className="font-bold text-base leading-tight mb-1">
                  {item.name}
                </h3>

                {item.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex justify-between items-center mt-3">
                  {/* ✅ ราคาเด่นขึ้น */}
                  <span className="text-orange-600 font-bold text-lg">
                    ฿{item.price.toLocaleString()}
                  </span>

                  {/* ✅ ปุ่มกดง่ายสำหรับ tablet */}
                  <button
                    className={`
                      bg-orange-500 text-white
                      w-10 h-10 rounded-full
                      text-xl font-bold
                      flex items-center justify-center  
                    `}
                  >
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
