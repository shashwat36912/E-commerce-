import { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { useUserStore } from '../stores/useUserStore';
import toast from 'react-hot-toast';

export default function FeedbackList({ productId }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();
  const isAdmin = Boolean(user?.isAdmin) || user?.role === 'admin';

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await axios.get(`/feedbacks/product/${productId}`);
        if (mounted) setFeedbacks(res.data.feedbacks || []);
      } catch (err) {
        console.error('Failed to load feedbacks', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    const handler = (e) => {
      if (e?.detail?.productId === productId) fetch();
    };
    window.addEventListener('feedback:posted', handler);
    return () => {
      mounted = false;
      window.removeEventListener('feedback:posted', handler);
    };
  }, [productId]);

  const deleteFeedback = async (id) => {
    if (!confirm('Delete this feedback?')) return;
    try {
      await axios.delete(`/feedbacks/${id}`);
      toast.success('Feedback deleted');
      // refresh list
      const res = await axios.get(`/feedbacks/product/${productId}`);
      setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      console.error('Failed to delete feedback', err);
      toast.error(err?.response?.data?.message || 'Failed to delete feedback');
    }
  };

  if (loading) return <div>Loading feedbacks...</div>;
  if (!feedbacks.length) return <div>No feedback yet. Be the first to comment!</div>;

  return (
    <div className='space-y-4'>
      {feedbacks.map((f) => (
        <div key={f._id} className='bg-gray-800 p-4 rounded'>
          <div className='flex items-center justify-between'>
            <strong>{f.author?.name || f.userName}</strong>
            <div className='flex items-center gap-3'>
              <span className='text-amber-300'>{f.rating} / 5</span>
              {(() => {
                const authorId = f.author?._id || f.author || f.author?._id?.toString();
                const currentUserId = user?._id || user?.id || user?._id?.toString();
                return ((authorId && String(authorId) === String(currentUserId)) || isAdmin) ? (
                  <button onClick={() => deleteFeedback(f._id)} className='text-red-400 hover:underline'>Delete</button>
                ) : null;
              })()}
            </div>
          </div>
          <p className='mt-2'>{f.comment}</p>
          <small className='text-gray-400'>{new Date(f.createdAt).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
