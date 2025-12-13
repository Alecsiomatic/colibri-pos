import React from "react";

type OrderFiltersProps = {
  filter: string;
  setFilter: (f: string) => void;
  dateFilter: string;
  setDateFilter: (f: string) => void;
  rangeStart: string;
  setRangeStart: (d: string) => void;
  rangeEnd: string;
  setRangeEnd: (d: string) => void;
};

const statuses = [
  "all",
  "pendiente",
  "procesando",
  "listo",
  "asignado",
  "aceptado",
  "enviado",
  "entregado",
  "cancelado",
];

export default function OrderFilters({
  filter,
  setFilter,
  dateFilter,
  setDateFilter,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
}: OrderFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => setFilter(status)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === status
              ? "bg-purple-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {status === "all"
            ? "Todos"
            : status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      ))}
      <button
        onClick={() => setDateFilter("HOY")}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          dateFilter === "HOY"
            ? "bg-emerald-600 text-white"
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`}
      >
        HOY
      </button>
      <input
        type="date"
        value={rangeStart}
        onChange={(e) => setRangeStart(e.target.value)}
        className="px-2 py-1 rounded bg-gray-800 text-white border border-purple-700"
        title="Desde"
      />
      <span className="text-purple-300">-</span>
      <input
        type="date"
        value={rangeEnd}
        onChange={(e) => setRangeEnd(e.target.value)}
        className="px-2 py-1 rounded bg-gray-800 text-white border border-purple-700"
        title="Hasta"
      />
      <button
        onClick={() => {
          setDateFilter("");
          setRangeStart("");
          setRangeEnd("");
        }}
        className="ml-2 px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700"
      >
        Limpiar
      </button>
    </div>
  );
}
