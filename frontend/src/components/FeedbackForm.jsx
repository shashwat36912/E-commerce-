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
      // Optionally trigger an event or reload feedback list by reloading page fragment
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
      <div className='mb-6'>
        <p className='text-gray-300'>Please <Link to='/sign-in' className='text-emerald-400 underline'>sign in</Link> to leave feedback.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className='mb-6 space-y-3'>
      <input className='w-full p-2 rounded bg-gray-800' placeholder='Your name' value={userName} onChange={(e) => setUserName(e.target.value)} />
      <div className='flex items-center gap-2'>
        <label>Rating:</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className='p-2 bg-gray-800 rounded'>
          {[5,4,3,2,1].map(r=> <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <textarea className='w-full p-2 rounded bg-gray-800' rows={4} placeholder='Your feedback' value={comment} onChange={(e)=>setComment(e.target.value)} />
      <button className='rounded bg-emerald-600 px-4 py-2' disabled={loading} type='submit'>{loading? 'Saving...' : 'Submit Feedback'}</button>
    </form>
  );
}
