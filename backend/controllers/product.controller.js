import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
	try {
		const products = await Product.find({}); // find all products
		res.json({ products });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = await redis.get("featured_products");
		if (featuredProducts) {
			return res.json(JSON.parse(featuredProducts));
		}

		// if not in redis, fetch from mongodb
		// .lean() is gonna return a plain javascript object instead of a mongodb document
		// which is good for performance
		featuredProducts = await Product.find({ isFeatured: true }).lean();

		if (!featuredProducts) {
			return res.status(404).json({ message: "No featured products found" });
		}

		// store in redis for future quick access

		await redis.set("featured_products", JSON.stringify(featuredProducts));

		res.json(featuredProducts);
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
	try {
		const { name, description, price, image, category } = req.body;

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await Product.create({
			name,
			description,
			price,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
			category,
		});

		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.image) {
			const publicId = product.image.split("/").pop().split(".")[0];
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloduinary");
			} catch (error) {
				console.log("error deleting image from cloduinary", error);
			}
		}

		await Product.findByIdAndDelete(req.params.id);

		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductById = async (req, res) => {
	try {
		const { id } = req.params;
		const product = await Product.findById(id);
		if (!product) return res.status(404).json({ message: 'Product not found' });
		res.json(product);
	} catch (error) {
		console.log('Error in getProductById controller', error.message);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category });
		res.json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, category, autoGenerate } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cloudinaryResponse = null;

    // अगर नई image आई है
    if (image && image !== product.image) {
      // नई image upload
      cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });

      // पुरानी image delete करने की कोशिश
      if (product.image) {
        try {
          const publicId = product.image.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (err) {
          console.log("Error deleting old image from Cloudinary", err.message);
        }
      }
    }

    // Fields update
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (cloudinaryResponse && cloudinaryResponse.secure_url) {
      product.image = cloudinaryResponse.secure_url;

      // ✅ अगर autoGenerate true है → AI से नया name + description लाएँ
      if (autoGenerate) {
        try {
					const aiText = await generateProductDetails(product.image);
					console.log("AI raw output (updateProduct):", aiText);
					const lines = aiText.split("\n").map(l => l.trim()).filter(l => l !== "");
					console.log("AI parsed lines (updateProduct):", lines);
					const aiNameLine = lines.find(l => l.toLowerCase().startsWith("name:"));
					const aiDescLine = lines.find(l => l.toLowerCase().startsWith("description:"));
					const aiCategoryLine = lines.find(l => l.toLowerCase().startsWith("category:"));
					product.name = aiNameLine ? aiNameLine.replace(/name:/i, "").trim() : product.name;
					product.description = aiDescLine ? aiDescLine.replace(/description:/i, "").trim() : product.description;
					if (aiCategoryLine) {
						const suggested = aiCategoryLine.replace(/category:/i, "").trim().toLowerCase();
						const allowed = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "suits", "bags"];
						if (allowed.includes(suggested)) {
							product.category = suggested;
						} else {
							console.log("AI suggested category not in allowed list:", suggested);
						}
					}
					console.log("Final product name/description/category after AI (updateProduct):", product.name, product.description, product.category);
        } catch (err) {
          console.log("AI generation failed:", err.message);
        }
      }
    }

    const updated = await product.save();
    await updateFeaturedProductsCache();

    res.json(updated);
  } catch (error) {
    console.log("Error in updateProduct controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


async function updateFeaturedProductsCache() {
	try {
		// The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

		const featuredProducts = await Product.find({ isFeatured: true }).lean();
		await redis.set("featured_products", JSON.stringify(featuredProducts));
	} catch (error) {
		console.log("error in update cache function");
	}
}


import { generateProductDetails } from "../lib/ai.js";

// New AI Auto-generate controller
export const autoGenerateProductDetails = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: "Image URL required" });

	const aiText = await generateProductDetails(image);

	const lines = aiText.split("\n").map(l => l.trim()).filter(l => l !== "");
	const aiNameLine = lines.find(l => l.toLowerCase().startsWith("name:"));
	const aiDescLine = lines.find(l => l.toLowerCase().startsWith("description:"));
	const aiCategoryLine = lines.find(l => l.toLowerCase().startsWith("category:"));
	const name = aiNameLine ? aiNameLine.replace(/name:/i, "").trim() : "";
	const description = aiDescLine ? aiDescLine.replace(/description:/i, "").trim() : "";
	const category = aiCategoryLine ? aiCategoryLine.replace(/category:/i, "").trim().toLowerCase() : "";

	// Validate category against allowed list
	const allowed = ["jeans", "t-shirts", "shoes", "glasses", "jackets", "suits", "bags"];
	const validCategory = allowed.includes(category) ? category : "";

	// Return parsed fields and raw AI text for debugging on frontend
	res.json({ name, description, category: validCategory, raw: aiText });
  } catch (error) {

    res.status(500).json({ message: "Server error", error: error.message });
  }
};

