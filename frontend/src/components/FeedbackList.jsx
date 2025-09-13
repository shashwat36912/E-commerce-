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
      const res = await axios.get(`/feedbacks/product/${productId}`);
      setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      console.error('Failed to delete feedback', err);
      toast.error(err?.response?.data?.message || 'Failed to delete feedback');
    }
  };

  if (loading) return <div className="text-gray-300">Loading feedbacks...</div>;
  if (!feedbacks.length) return <div className="text-gray-400">No feedback yet. Be the first to comment!</div>;

  return (
    <div className="space-y-6">
      {feedbacks.map((f) => {
        const authorId = f.author?._id || f.author || f.author?._id?.toString();
        const currentUserId = user?._id || user?.id || user?._id?.toString();
        const canDelete = (authorId && String(authorId) === String(currentUserId)) || isAdmin;

        return (
          <div
            key={f._id}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-xl
                       border border-slate-700/50 transition transform duration-300
                       hover:-translate-y-1 hover:shadow-emerald-500/30 hover:border-emerald-400/40"
          >
            <div className="flex items-center justify-between">
              <strong className="text-emerald-300 font-semibold tracking-wide">
                {f.author?.name || f.userName}
              </strong>
              <div className="flex items-center gap-4">
                <span className="text-amber-300 font-medium">{f.rating} / 5</span>
                {canDelete && (
                  <button
                    onClick={() => deleteFeedback(f._id)}
                    className="text-red-400 hover:text-red-300 hover:underline
                               transition-colors duration-200"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 text-slate-200 leading-relaxed">{f.comment}</p>
            <small className="block mt-2 text-slate-400 text-xs">
              {new Date(f.createdAt).toLocaleString()}
            </small>
          </div>
        );
      })}
    </div>
  );
}
