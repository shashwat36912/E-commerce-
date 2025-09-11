import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trash, Star, Edit, Loader, Upload } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const ProductsList = () => {
	const { deleteProduct, toggleFeaturedProduct, products, updateProduct } = useProductStore();

	const [editingProduct, setEditingProduct] = useState(null);
	const [formState, setFormState] = useState({ name: "", description: "", price: "", category: "", image: "" });

	const startEdit = (product) => {
		setEditingProduct(product._id);
		setFormState({
			name: product.name || "",
			description: product.description || "",
			price: product.price ?? "",
			category: product.category || "",
			image: "",
		});
	};

	const cancelEdit = () => {
		setEditingProduct(null);
		setFormState({ name: "", description: "", price: "", category: "", image: "" });
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => setFormState((s) => ({ ...s, image: reader.result }));
			reader.readAsDataURL(file);
		}
	};

	const submitEdit = async (productId) => {
		await updateProduct(productId, {
			name: formState.name,
			description: formState.description,
			price: parseFloat(formState.price),
			category: formState.category,
			image: formState.image || undefined,
		});
		cancelEdit();
	};

	console.log("products", products);

	return (
		<>
		<motion.div
			className='bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
			<table className=' min-w-full divide-y divide-gray-700'>
				<thead className='bg-gray-700'>
					<tr>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Product
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Price
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Category
						</th>

						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Featured
						</th>
						<th
							scope='col'
							className='pr-6 pl-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
						>
							Actions
						</th>
					</tr>
				</thead>
				<tbody className='bg-gray-800 divide-y divide-gray-700'>
					{products?.map((product) => (
						<React.Fragment key={product._id}>
							<tr className='hover:bg-gray-700'>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='flex items-center'>
									<div className='flex-shrink-0 h-10 w-10'>
										<img
											className='h-10 w-10 rounded-full object-cover'
											src={product.image}
											alt={product.name}
										/>
									</div>
									<div className='ml-4'>
										<div className='text-sm font-medium text-white'>{product.name}</div>
					
										{/* Mobile actions: visible only on small screens */}
										<div className='flex items-center space-x-3 mt-2 md:hidden'>
											<button
												onClick={() => startEdit(product)}
												className='text-emerald-300 hover:text-emerald-200'
											>
												<Edit className='h-5 w-5' />
											</button>
											<button
												onClick={() => deleteProduct(product._id)}
												className='text-red-400 hover:text-red-300'
											>
												<Trash className='h-5 w-5' />
											</button>
										</div>
									</div>
								</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-gray-300'>${product.price.toFixed(2)}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-gray-300'>{product.category}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<button
									onClick={() => toggleFeaturedProduct(product._id)}
									className={`p-1 rounded-full ${
										product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-600 text-gray-300"
									} hover:bg-yellow-500 transition-colors duration-200`}
								>
									<Star className='h-5 w-5' />
								</button>
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm font-medium hidden md:table-cell'>
								<div className='flex items-center space-x-3'>
									<button
										onClick={() => startEdit(product)}
										className='text-emerald-300 hover:text-emerald-200'
									>
										<Edit className='h-5 w-5' />
									</button>
									<button
										onClick={() => deleteProduct(product._id)}
										className='text-red-400 hover:text-red-300'
									>
										<Trash className='h-5 w-5' />
									</button>
								</div>
							</td>

							</tr>
							{/* edit modal is rendered outside the table for better mobile UX */}
						</React.Fragment>
					))}
				</tbody>
			</table>
		</motion.div>
		{editingProduct && (
			<div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
				<div className='bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl mx-4'>
					<div className='p-4 border-b border-gray-800 flex justify-between items-center'>
						<h3 className='text-lg font-medium text-white'>Edit Product</h3>
						<button onClick={cancelEdit} className='text-gray-300 hover:text-white'>✕</button>
					</div>
					<div className='p-4'>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							<input
								type='text'
								className='bg-gray-700 p-2 rounded text-white'
								value={formState.name}
								onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
								placeholder='Name'
								/>
							<input
								type='number'
								className='bg-gray-700 p-2 rounded text-white'
								value={formState.price}
								onChange={(e) => setFormState((s) => ({ ...s, price: e.target.value }))}
								placeholder='Price'
								step='0.01'
								/>
							<select
								className='bg-gray-700 p-2 rounded text-white'
								value={formState.category}
								onChange={(e) => setFormState((s) => ({ ...s, category: e.target.value }))}
							>
								<option value=''>Category</option>
								<option value='jeans'>jeans</option>
								<option value='t-shirts'>t-shirts</option>
								<option value='shoes'>shoes</option>
								<option value='glasses'>glasses</option>
								<option value='jackets'>jackets</option>
								<option value='suits'>suits</option>
								<option value='bags'>bags</option>
							</select>
						</div>
						<div className='mt-3'>
							<textarea
								className='w-full bg-gray-700 p-2 rounded text-white'
								value={formState.description}
								onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
								placeholder='Description'
								rows={4}
							/>
						</div>
						<div className='mt-3 flex items-center'>
							<input type='file' id='modal-edit-image' className='sr-only' accept='image/*' onChange={handleImageChange} />
							<label htmlFor='modal-edit-image' className='cursor-pointer bg-gray-700 py-2 px-3 rounded text-sm text-gray-200'>
								<Upload className='inline-block mr-2 h-4 w-4' /> Upload Image
							</label>
							{formState.image && <span className='ml-3 text-sm text-gray-400'>New image selected</span>}
						</div>
						<div className='mt-4 flex justify-end space-x-2'>
							<button onClick={() => submitEdit(editingProduct)} className='bg-emerald-600 text-white py-2 px-4 rounded'>Save</button>
							<button onClick={cancelEdit} className='bg-gray-600 text-white py-2 px-4 rounded'>Cancel</button>
						</div>
					</div>
				</div>
			</div>
		)}
		</>
	);
};
export default ProductsList;
