import React, { useState } from "react";
import { useUserStore } from "../stores/useUserStore";

const ProfilePage = () => {
  const { user, updateProfile } = useUserStore();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", password: "" });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold">No profile available</h2>
        <p>Please login to view your profile.</p>
      </div>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updates = { name: form.name, email: form.email };
    if (form.password) updates.password = form.password;
    await updateProfile(updates);
    setForm({ ...form, password: "" });
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold mb-6">Your Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gray-800 rounded-md">
          <p className="text-sm text-gray-400">Name</p>
          <p className="text-xl font-semibold">{user.name}</p>

          <p className="text-sm text-gray-400 mt-4">Email</p>
          <p className="text-xl font-semibold">{user.email}</p>
        </div>

        <form className="p-6 bg-gray-800 rounded-md" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-gray-400">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full mt-1 p-2 rounded bg-gray-900" />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400">Email</label>
            <input name="email" value={form.email} onChange={handleChange} className="w-full mt-1 p-2 rounded bg-gray-900" />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400">New Password (leave empty to keep)</label>
            <input name="password" value={form.password} onChange={handleChange} type="password" className="w-full mt-1 p-2 rounded bg-gray-900" />
          </div>

          <button className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded">Update Profile</button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
