import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader } from "lucide-react";

const categories = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "suits", "bags"];

const CreateProductForm = () => {
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("newProduct state changed:", newProduct);
  }, [newProduct]);

 
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      const imageUrl = data.secure_url;
      setNewProduct((prev) => ({ ...prev, image: imageUrl }));

      // Optional: auto-generate name & description
      try {
        const aiRes = await fetch("/api/products/auto-generate", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageUrl }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          console.log("AI suggestion category:", aiData.category);
          setNewProduct((prev) => ({
            ...prev,
            name: aiData.name || prev.name,
            description: aiData.description || prev.description,
            category: aiData.category || prev.category,
          }));
        }
      } catch (aiErr) {
        console.warn("AI auto-generate failed:", aiErr.message);
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Image upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !newProduct.name ||
      !newProduct.description ||
      !newProduct.price ||
      !newProduct.category ||
      !newProduct.image
    ) {
      alert("Please fill all fields and upload an image.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      console.log("Product created:", data);
      alert("✅ Product created successfully!");
      setNewProduct({
        name: "",
        description: "",
        price: "",
        category: "",
        image: "",
      });
    } catch (err) {
      console.error("Error creating product:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl rounded-2xl p-8 max-w-xl mx-auto 
                 border border-slate-700/50 hover:shadow-emerald-500/20 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-3xl font-bold mb-8 text-emerald-300 tracking-wide text-center">
        Create New Product
      </h2>

      {/* Preview */}
      {newProduct.image && (
        <img
          src={newProduct.image}
          alt="Preview"
          className="w-full h-48 object-cover rounded-lg border border-slate-700 mb-6"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={newProduct.name}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200
                       placeholder-slate-400 focus:outline-none focus:border-emerald-400
                       focus:ring-1 focus:ring-emerald-400 transition-colors duration-200"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Description</label>
          <textarea
            name="description"
            rows={3}
            value={newProduct.description}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200
                       placeholder-slate-400 focus:outline-none focus:border-emerald-400
                       focus:ring-1 focus:ring-emerald-400 transition-colors duration-200"
            required
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Price</label>
          <input
            type="number"
            name="price"
            value={newProduct.price}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200
                       placeholder-slate-400 focus:outline-none focus:border-emerald-400
                       focus:ring-1 focus:ring-emerald-400 transition-colors duration-200"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-1">Category</label>
          <select
            name="category"
            value={newProduct.category}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200
                       focus:outline-none focus:border-emerald-400 focus:ring-1
                       focus:ring-emerald-400 transition-colors duration-200"
            required
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Image Upload */}
        <div className="flex items-center">
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="sr-only"
          />
          <label
            htmlFor="image"
            className="cursor-pointer bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 
                       text-slate-300 flex items-center gap-2 hover:bg-slate-700
                       focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400
                       transition-colors duration-200"
          >
            <Upload className="h-5 w-5" />
            Upload Image
          </label>
          {newProduct.image && (
            <span className="ml-3 text-sm text-emerald-300">Image uploaded</span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-3 rounded-lg bg-emerald-600 
                     text-white font-semibold shadow-md hover:bg-emerald-500
                     hover:shadow-emerald-400/30 focus:outline-none focus:ring-2
                     focus:ring-emerald-400 disabled:opacity-60 transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <PlusCircle className="h-5 w-5" />
              Create Product
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateProductForm;

