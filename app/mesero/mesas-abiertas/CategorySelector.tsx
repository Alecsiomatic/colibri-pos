import React, { useEffect, useState } from "react";

export default function CategorySelector({ value, onChange }: {
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
    <div className="mb-4">
      <label className="block mb-1 font-semibold">Categoría</label>
      <select className="w-full border rounded p-2" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Selecciona una categoría</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  );
}
