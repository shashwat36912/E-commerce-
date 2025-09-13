import React, { useEffect, useState, useMemo } from "react";
import axios from "../lib/axios";
import formatCurrency from "../lib/currency";

export default function StatsPanel({ type, onClose }) {
  const [items, setItems] = useState([]);
  const [view, setView] = useState('list'); // 'list' or 'table'
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const filteredItems = useMemo(() => {
    if (type === 'users') {
      return (items || []).filter((u) => !u.isAdmin);
    }
    return items || [];
  }, [items, type]);

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

  const removeUser = async (userId) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      setProcessingId(userId);
      await axios.delete(`/admin/users/${userId}`);
      setItems((s) => s.filter((u) => String(u._id) !== String(userId)));
    } catch (err) {
      console.error('Error deleting user', err?.message || err);
      alert('Failed to delete user');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleRole = async (userId, currentIsAdmin) => {
    const newIsAdmin = !currentIsAdmin;
    if (!confirm(`Change user to ${newIsAdmin ? 'Admin' : 'Customer'}?`)) return;
    try {
      setProcessingId(userId);
      const res = await axios.put(`/admin/users/${userId}`, { isAdmin: newIsAdmin, role: newIsAdmin ? 'admin' : 'customer' });
      const updated = res.data.user;
      setItems((s) => s.map((u) => (String(u._id) === String(userId) ? updated : u)));
    } catch (err) {
      console.error('Error updating user role', err?.message || err);
      alert('Failed to update role');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mb-6">
      <div className="card-surface rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl font-semibold text-primary capitalize">{type}</h3>
            <div className="text-sm muted">Total: {filteredItems.length}</div>
          </div>
          <button
            className="px-3 py-2 rounded-md bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.06)] transition text-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-8">Loading...</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="text-muted">No {type} found or failed to load data.</div>
            ) : (
              <div>
                {/* View toggle for users */}
                {type === 'users' && (
                  <div className="flex items-center justify-end mb-3 gap-2">
                    <button
                      className={`px-3 py-1 rounded ${view === 'list' ? 'bg-[rgba(255,255,255,0.04)]' : 'bg-transparent'} text-sm`}
                      onClick={() => setView('list')}
                    >
                      List
                    </button>
                    <button
                      className={`px-3 py-1 rounded ${view === 'table' ? 'bg-[rgba(255,255,255,0.04)]' : 'bg-transparent'} text-sm`}
                      onClick={() => setView('table')}
                    >
                      Table
                    </button>
                  </div>
                )}

                {type === 'users' ? (
                  view === 'table' ? (
                    <div className="overflow-x-auto bg-[rgba(255,255,255,0.01)] rounded"> 
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="text-muted border-b border-[rgba(255,255,255,0.04)]">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map((it, idx) => (
                            <tr key={it._id || it.id || idx} className="hover:bg-[rgba(255,255,255,0.02)] transition">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-md bg-[rgba(255,255,255,0.04)] flex items-center justify-center font-bold text-white">{(it.name || it.fullName || it.email || '').charAt(0).toUpperCase()}</div>
                                  <div>
                                    <div className="text-white font-medium">{it.name || it.fullName || `#${it._id || it.id}`}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 muted">{it.email}</td>
                              <td className="px-4 py-3 muted">{it.isAdmin ? 'Admin' : 'Customer'}</td>
                              <td className="px-4 py-3 muted">{new Date(it.createdAt || it.date || Date.now()).toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    className="text-sm px-2 py-1 rounded bg-[rgba(255,255,255,0.04)]"
                                    onClick={() => toggleRole(it._id, it.isAdmin)}
                                    disabled={processingId === it._id}
                                  >
                                    {it.isAdmin ? 'Make customer' : 'Make admin'}
                                  </button>
                                  <button
                                    className="text-sm px-2 py-1 rounded bg-red-500/10 text-red-400"
                                    onClick={() => removeUser(it._id)}
                                    disabled={processingId === it._id}
                                  >
                                    {processingId === it._id ? '...' : 'Remove'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {filteredItems.map((it, idx) => (
                        <li
                          key={it._id || it.id || idx}
                          className="flex items-center justify-between p-4 rounded-lg bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.03)] transition"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[rgba(255,255,255,0.04)] text-white font-bold">{(it.name || it.fullName || it.email || '').charAt(0).toUpperCase()}</div>
                              <div>
                                <div className="text-white font-medium">
                                  {it.name || it.fullName || it.email || `#${it._id || it.id}`}
                                </div>
                                <div className="text-sm muted">
                                  {it.email}
                                </div>
                              </div>
                            </div>

                            <div className="text-sm muted">{new Date(it.createdAt || it.date || Date.now()).toLocaleString()}</div>
                          </div>

                          <div>
                            <button className="text-sm px-2 py-1 rounded bg-[rgba(255,255,255,0.04)] mr-2" onClick={() => toggleRole(it._id, it.isAdmin)} disabled={processingId === it._id}>{it.isAdmin ? 'Make customer' : 'Make admin'}</button>
                            <button className="text-sm px-2 py-1 rounded bg-red-500/10 text-red-400" onClick={() => removeUser(it._id)} disabled={processingId === it._id}>{processingId === it._id ? '...' : 'Remove'}</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )
                ) : type === 'products' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((p, i) => (
                      <div key={p._id || p.id || i} className="card-surface p-4 rounded-lg">
                        <div className="flex flex-col">
                          <div className="w-full h-40 bg-[rgba(255,255,255,0.03)] rounded overflow-hidden flex items-center justify-center">
                            {p.image ? (
                              // eslint-disable-next-line jsx-a11y/img-redundant-alt
                              <img src={p.image} alt={`Image of ${p.name}`} className="object-cover w-full h-full" />
                            ) : (
                              <div className="text-muted">No image</div>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div>
                              <div className="text-white font-medium truncate">{p.name}</div>
                              <div className="text-sm muted-sm">{p.category}</div>
                            </div>
                            <div className="text-sm muted">{new Date(p.createdAt || p.date || Date.now()).toLocaleDateString()}</div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-white font-semibold">{p.price ? formatCurrency(p.price) : '-'}</div>
                            <div>
                              <span className={`chip ${p.isFeatured ? 'bg-[rgba(15,118,110,0.12)]' : ''}`}>{p.isFeatured ? 'Featured' : 'Product'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Sales table view */
                  <div className="overflow-x-auto bg-[rgba(255,255,255,0.01)] rounded">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="text-muted border-b border-[rgba(255,255,255,0.04)]">
                          <th className="px-4 py-3">Order</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Items</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => (
                          <tr key={it._id || it.id || idx} className="hover:bg-[rgba(255,255,255,0.02)] transition">
                            <td className="px-4 py-3">
                              <div className="text-white font-medium">Order #{it._id}</div>
                              <div className="text-sm muted">{it.status || ''}</div>
                            </td>
                            <td className="px-4 py-3 muted">{(it.user && (it.user.name || it.user.email)) || it.email || 'Guest'}</td>
                            <td className="px-4 py-3 muted">{(it.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0)}</td>
                            <td className="px-4 py-3 text-white">{it.totalAmount ? formatCurrency(it.totalAmount) : '-'}</td>
                            <td className="px-4 py-3 muted">{new Date(it.createdAt || it.date || Date.now()).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
