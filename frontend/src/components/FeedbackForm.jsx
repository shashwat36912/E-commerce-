import { useState } from 'react';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../stores/useUserStore';
import { Link } from 'react-router-dom';

export default function FeedbackForm({ productId }) {
  const { user } = useUserStore();
  const [userName, setUserName] = useState(user?.name || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please sign in to submit feedback');
    if (!userName || !comment) return toast.error('Please enter name and comment');
    setLoading(true);
    try {
      await axios.post(`/feedbacks/product/${productId}`, { userName, rating, comment });
      toast.success('Feedback submitted');
      setUserName(user?.name || '');
      setComment('');
      setRating(5);
      window.dispatchEvent(new CustomEvent('feedback:posted', { detail: { productId } }));
    } catch (err) {
      console.error('Failed to submit feedback', err);
      toast.error(err?.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="mb-6">
        <p className="text-slate-300">
          Please{' '}
          <Link
            to="/sign-in"
            className="text-emerald-400 underline hover:text-emerald-300 transition-colors duration-200"
          >
            sign in
          </Link>{' '}
          to leave feedback.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mb-8 space-y-4 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl 
                 shadow-xl border border-slate-700/50 transition duration-300
                 hover:shadow-emerald-500/20"
    >
      <input
        className="w-full p-3 rounded-lg bg-slate-800 text-slate-200 placeholder-slate-400
                   border border-slate-700 focus:outline-none focus:border-emerald-400
                   transition-colors duration-200"
        placeholder="Your name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />

      <div className="flex items-center gap-3 text-slate-200">
        <label className="font-medium">Rating:</label>
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="p-2 rounded-lg bg-slate-800 border border-slate-700
                     focus:outline-none focus:border-emerald-400
                     transition-colors duration-200"
        >
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <textarea
        className="w-full p-3 rounded-lg bg-slate-800 text-slate-200 placeholder-slate-400
                   border border-slate-700 focus:outline-none focus:border-emerald-400
                   transition-colors duration-200"
        rows={4}
        placeholder="Your feedback"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button
        disabled={loading}
        type="submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white
                   hover:bg-emerald-500 active:bg-emerald-700
                   disabled:opacity-60 disabled:cursor-not-allowed
                   transition-all duration-200 shadow-md hover:shadow-emerald-400/30"
      >
        {loading ? 'Saving…' : 'Submit Feedback'}
      </button>
    </form>
  );
}
