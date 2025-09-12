import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../lib/axios';
import formatCurrency from '../lib/currency';
import FeedbackList from '../components/FeedbackList';
import FeedbackForm from '../components/FeedbackForm';

export default function MoreDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/products/${id}`);
        if (mounted) setProduct(res.data);
      } catch (err) {
        console.error('Failed to load product', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProduct();
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className='p-6'>Loading...</div>;
  if (!product) return <div className='p-6'>Product not found</div>;

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <div className='flex flex-col md:flex-row gap-6'>
        <img src={product.image} alt={product.name} className='w-full md:w-1/2 object-cover rounded-lg' />
        <div className='text-white'>
          <h1 className='text-3xl font-bold mb-2'>{product.name}</h1>
          <p className='text-emerald-400 text-2xl mb-4'>{formatCurrency(product.price)}</p>
          <p className='mb-4'>{product.description}</p>
          <p className='mb-4'>Category: {product.category}</p>
          <p className='mb-6'>Available quantity: {product.quantity ?? 'Unknown'}</p>
        </div>
      </div>

      <div className='mt-8'>
        <h2 className='text-2xl font-semibold mb-4'>Feedback</h2>
        <FeedbackForm productId={id} />
        <FeedbackList productId={id} />
      </div>
    </div>
  );
}
