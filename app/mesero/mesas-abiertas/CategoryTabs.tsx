import React, { useEffect, useState } from "react";

export default function CategoryTabs({ value, onChange }: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/products-mysql/categories")
      .then(res => res.json())
      .then(data => setCategories(data.categories || []));
  }, []);

  return (
    <div className="flex overflow-x-auto gap-2 p-2 bg-white/80 rounded-t-lg border-b">
      {categories.map(cat => (
        <button
          key={cat}
          className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold text-sm transition-all ${value === cat ? 'bg-yellow-700 text-white shadow-lg' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}