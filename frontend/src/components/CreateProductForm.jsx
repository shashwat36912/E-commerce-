import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const categories = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "suits", "bags"];

const CreateProductForm = () => {
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
  });

  const { createProduct, loading } = useProductStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProduct(newProduct);
      setNewProduct({ name: "", description: "", price: "", category: "", image: "" });
    } catch {
      console.log("error creating a product");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl rounded-2xl p-8 mb-10 max-w-xl mx-auto 
                 border border-slate-700/50 hover:shadow-emerald-500/20 transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h2 className="text-3xl font-bold mb-8 text-emerald-300 tracking-wide text-center">
        Create New Product
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-1">
            Product Name
          </label>
          <input
            type="text"
            id="name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 
                       placeholder-slate-400 focus:outline-none focus:border-emerald-400
                       focus:ring-1 focus:ring-emerald-400 transition-colors duration-200"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-slate-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows="3"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 
                       placeholder-slate-400 focus:outline-none focus:border-emerald-400
                       focus:ring-1 focus:ring-emerald-400 transition-colors duration-200"
            required
          />
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-slate-300 mb-1">
            Price
          </label>
          <input
            type="number"
            id="price"
            step="0.01"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 
                       placeholder-slate-400 focus:outline-none focus:border-emerald-400
                       focus:ring-1 focus:ring-emerald-400 transition-colors duration-200"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-slate-300 mb-1">
            Category
          </label>
          <select
            id="category"
            value={newProduct.category}
            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200
                       focus:outline-none focus:border-emerald-400 focus:ring-1
                       focus:ring-emerald-400 transition-colors duration-200"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
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
