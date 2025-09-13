import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";
import formatCurrency from "../lib/currency";

export default function StatsPanel({ type, onClose }) {
  const [items, setItems] = useState([]);
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const filteredItems = useMemo(() => {
    return type === "users" ? (items || []).filter((u) => !u.isAdmin) : items || [];
  }, [items, type]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        let res;
        if (type === "users") res = await axios.get("/admin/users");
        else if (type === "products") res = await axios.get("/products");
        else if (type === "sales") res = await axios.get("/orders");
        if (mounted) setItems(res?.data?.users || res?.data?.products || res?.data?.orders || []);
      } catch (err) {
        console.error("Error loading data:", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [type]);

  const removeUser = async (userId) => {
    if (!confirm("Delete this user? This action cannot be undone.")) return;
    try {
      setProcessingId(userId);
      await axios.delete(`/admin/users/${userId}`);
      setItems((prev) => prev.filter((u) => String(u._id) !== String(userId)));
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete user");
    } finally {
      setProcessingId(null);
    }
  };

  const toggleRole = async (userId, current) => {
    const newIsAdmin = !current;
    if (!confirm(`Change user to ${newIsAdmin ? "Admin" : "Customer"}?`)) return;
    try {
      setProcessingId(userId);
      const { data } = await axios.put(`/admin/users/${userId}`, {
        isAdmin: newIsAdmin,
        role: newIsAdmin ? "admin" : "customer",
      });
      setItems((s) => s.map((u) => (String(u._id) === String(userId) ? data.user : u)));
    } catch (err) {
      console.error("Role update failed", err);
      alert("Failed to update role");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="panel"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 
                   rounded-2xl p-6 shadow-2xl border border-gray-700 text-gray-100"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-2xl font-bold capitalize">{type}</h3>
            <p className="text-sm text-gray-400">Total: {filteredItems.length}</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500
                       transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>

        {/* Loading / Empty */}
        {loading ? (
          <div className="py-10 text-center text-gray-400">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            No {type} found or failed to load.
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {type === "users" && (
              <div className="flex justify-end mb-3 gap-2">
                {["list", "table"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      view === v
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* --- USERS --- */}
            {type === "users" ? (
              view === "table" ? (
                <UserTable
                  users={filteredItems}
                  processingId={processingId}
                  onRole={toggleRole}
                  onRemove={removeUser}
                />
              ) : (
                <UserList
                  users={filteredItems}
                  processingId={processingId}
                  onRole={toggleRole}
                  onRemove={removeUser}
                />
              )
            ) : type === "products" ? (
              <ProductGrid items={items} />
            ) : (
              <SalesTable items={items} />
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ---------------------- Subcomponents ---------------------- */
const UserTable = ({ users, processingId, onRole, onRemove }) => (
  <div className="overflow-x-auto rounded-lg bg-gray-800/40">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-gray-400 border-b border-gray-700">
          <th className="px-4 py-3">Name</th>
          <th className="px-4 py-3">Email</th>
          <th className="px-4 py-3">Role</th>
          <th className="px-4 py-3">Created</th>
          <th className="px-4 py-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u._id} className="hover:bg-gray-700/30 transition">
            <td className="px-4 py-3 text-white">{u.name || u.email}</td>
            <td className="px-4 py-3 text-gray-300">{u.email}</td>
            <td className="px-4 py-3 text-gray-300">{u.isAdmin ? "Admin" : "Customer"}</td>
            <td className="px-4 py-3 text-gray-400">
              {new Date(u.createdAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 flex gap-2">
              <ActionButton
                onClick={() => onRole(u._id, u.isAdmin)}
                disabled={processingId === u._id}
              >
                {u.isAdmin ? "Make Customer" : "Make Admin"}
              </ActionButton>
              <ActionButton
                danger
                onClick={() => onRemove(u._id)}
                disabled={processingId === u._id}
              >
                {processingId === u._id ? "..." : "Remove"}
              </ActionButton>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const UserList = ({ users, processingId, onRole, onRemove }) => (
  <ul className="space-y-3">
    {users.map((u) => (
      <li
        key={u._id}
        className="flex justify-between items-center bg-gray-800/40
                   hover:bg-gray-700/30 p-4 rounded-lg transition"
      >
        <div>
          <div className="text-white font-semibold">{u.name || u.email}</div>
          <div className="text-gray-400 text-sm">{u.email}</div>
          <div className="text-gray-500 text-xs">
            {new Date(u.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">
          <ActionButton
            onClick={() => onRole(u._id, u.isAdmin)}
            disabled={processingId === u._id}
          >
            {u.isAdmin ? "Make Customer" : "Make Admin"}
          </ActionButton>
          <ActionButton
            danger
            onClick={() => onRemove(u._id)}
            disabled={processingId === u._id}
          >
            {processingId === u._id ? "..." : "Remove"}
          </ActionButton>
        </div>
      </li>
    ))}
  </ul>
);

const ProductGrid = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map((p) => (
      <motion.div
        key={p._id}
        whileHover={{ scale: 1.02 }}
        className="bg-gray-800/40 rounded-xl p-4 shadow hover:shadow-emerald-700/30 transition"
      >
        <div className="h-40 bg-gray-700 rounded-md flex justify-center items-center overflow-hidden">
          {p.image ? (
            <img src={p.image} alt={p.name} className="object-cover h-full w-full" />
          ) : (
            <span className="text-gray-400">No Image</span>
          )}
        </div>
        <div className="mt-3">
          <h4 className="text-white font-semibold truncate">{p.name}</h4>
          <p className="text-sm text-gray-400">{p.category}</p>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-emerald-400 font-bold">
              {formatCurrency(p.price)}
            </span>
            {p.isFeatured && (
              <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded text-xs">
                Featured
              </span>
            )}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
);

const SalesTable = ({ items }) => (
  <div className="overflow-x-auto rounded-lg bg-gray-800/40">
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-gray-400 border-b border-gray-700">
          <th className="px-4 py-3">Order</th>
          <th className="px-4 py-3">Customer</th>
          <th className="px-4 py-3">Items</th>
          <th className="px-4 py-3">Total</th>
          <th className="px-4 py-3">Created</th>
        </tr>
      </thead>
      <tbody>
        {items.map((o) => (
          <tr key={o._id} className="hover:bg-gray-700/30 transition">
            <td className="px-4 py-3 text-white font-medium">#{o._id}</td>
            <td className="px-4 py-3 text-gray-300">
              {o.user?.name || o.user?.email || "Guest"}
            </td>
            <td className="px-4 py-3 text-gray-300">
              {(o.items || []).reduce((s, i) => s + (i.quantity || 0), 0)}
            </td>
            <td className="px-4 py-3 text-emerald-400 font-semibold">
              {formatCurrency(o.totalAmount)}
            </td>
            <td className="px-4 py-3 text-gray-400">
              {new Date(o.createdAt).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ActionButton = ({ children, onClick, disabled, danger }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1 rounded-md text-sm transition-colors 
      ${danger
        ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
        : "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
      } disabled:opacity-40`}
  >
    {children}
  </button>
);
