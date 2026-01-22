"use client";

export default function CategorySidebar({ categories, selected, onSelect }) {
  return (
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

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={`w-full text-left px-4 py-3 mb-1 rounded text-sm transition
              ${
                selected === cat
                  ? "bg-orange-600"
                  : "hover:bg-orange-800"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
