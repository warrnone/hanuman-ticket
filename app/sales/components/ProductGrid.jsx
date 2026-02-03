"use client";

export default function ProductGrid({ title, items, onAdd }) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
        <h2 className="text-xl md:text-2xl font-semibold text-white">
          {title}
        </h2>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {/* Grid Container */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 max-w-[1600px] mx-auto">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => onAdd(item)}
              className={`
                group
                bg-white rounded-2xl shadow-md
                hover:shadow-2xl hover:-translate-y-1
                transition-all duration-300
                cursor-pointer 
                border border-gray-100
                active:scale-[0.98]
                overflow-hidden
              `}
            >
              {/* IMAGE */}
              <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                {typeof item.image === "string" && item.image.startsWith("http") ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                    {item.image}
                  </span>
                )}
                
                {/* Optional: Overlay gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* INFO */}
              <div className="p-5">
                <h3 className="font-bold text-base leading-tight mb-2 text-gray-800 group-hover:text-orange-600 transition-colors">
                  {item.name}
                </h3>

                {item.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                )}

                <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                  {/* Price */}
                  <div>
                    <span className="text-orange-600 font-bold text-xl">
                      {item.price.toLocaleString()}฿
                    </span>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(item);
                    }}
                    className={`
                      bg-gradient-to-r from-orange-500 to-orange-600
                      hover:from-orange-600 hover:to-orange-700
                      text-white
                      w-11 h-11 rounded-full
                      text-xl font-bold
                      flex items-center justify-center
                      shadow-lg hover:shadow-xl
                      transition-all duration-200
                      group-hover:scale-110
                      active:scale-95
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
