import React, { useEffect, useState } from "react";
import axios from "../lib/axios";
import formatCurrency from "../lib/currency";

export default function StatsPanel({ type, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      let fetchError = null;
      try {
        if (type === "users") {
          const res = await axios.get("/admin/users");
          if (mounted) setItems(res.data.users || res.data || []);
        } else if (type === "products") {
          const res = await axios.get("/products");
          if (mounted) setItems(res.data.products || res.data || []);
        } else if (type === "sales") {
          const res = await axios.get("/orders");
          if (mounted) setItems(res.data.orders || res.data || []);
        }
      } catch (err) {
        fetchError = err;
        console.error("Error fetching stats panel data", err.message || err);
      } finally {
        if (mounted) {
          setLoading(false);
          if (fetchError) setItems([]);
        }
      }
    };

    fetch();
    return () => (mounted = false);
  }, [type]);

  return (
    <div className="mb-6">
      <div className="bg-gray-900/80 rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-emerald-300 capitalize">{type}</h3>
          <button className="bg-gray-700 px-3 py-1 rounded" onClick={onClose}>
            Close
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-300">Loading...</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="mb-3 text-sm text-gray-400">Total: {items.length}</div>
            {items.length === 0 ? (
              <div className="text-gray-400">No {type} found or failed to load data.</div>
            ) : (
              <ul className="space-y-3">
                {items.map((it, idx) => (
                  <li
                    key={it._id || it.id || idx}
                    className="p-3 bg-gray-800 rounded"
                  >
                    {type === "sales" ? (
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-white font-medium">Order #{it._id}</div>
                            <div className="text-sm text-gray-400">Total: {it.totalAmount ? formatCurrency(it.totalAmount) : "-"}</div>
                          </div>
                          <div className="text-sm text-gray-500">{new Date(it.createdAt || it.date || Date.now()).toLocaleString()}</div>
                        </div>

                        <ul className="mt-3 space-y-2">
                          {(it.items || []).map((oi, j) => (
                            <li key={oi.productId || oi.name || j} className="flex justify-between items-center text-sm text-gray-300">
                              <div className="truncate pr-4">{oi.name || `Product ${oi.productId || "#"}`}</div>
                              <div className="text-gray-400">{oi.quantity} × {oi.price ? formatCurrency(oi.price) : "--"}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white font-medium">
                            {it.name || it.fullName || it.email || it.title || `#${it._id || it.id}`}
                          </div>
                          <div className="text-sm text-gray-400">
                            {it.email || it.category || (it.totalAmount ? formatCurrency(it.totalAmount) : "")}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{new Date(it.createdAt || it.date || Date.now()).toLocaleString()}</div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
