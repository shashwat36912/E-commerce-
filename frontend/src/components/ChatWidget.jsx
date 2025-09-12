import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from '../lib/axios';
import { useCartStore } from '../stores/useCartStore';

const ChatWidget = ({ open, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    if (!open) return;
    // welcome message
    setMessages([
      { role: 'assistant', text: 'Hi! I can help recommend products or answer questions. Ask me anything.' },
    ]);
  }, [open]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  const send = async (overrideText) => {
    const textToSend = overrideText ?? input;
    if (!textToSend || !textToSend.trim()) return;
    const userMsg = { role: 'user', text: textToSend };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post('/ai/chat', { message: textToSend });
      // handle a few possible response shapes
      const reply = res.data?.reply;
      // if server provided product-level info in reply, push structured message
      if (reply && reply.product) {
        setMessages((m) => [...m, { role: 'assistant', text: reply.text, product: reply.product }]);
      } else {
        const replyText = reply?.text || res.data?.reply || (res.data && JSON.stringify(res.data)) || 'Sorry, no response';
        setMessages((m) => [...m, { role: 'assistant', text: replyText }]);
      }
    } catch (err) {
      console.error('Chat error', err);
      setMessages((m) => [...m, { role: 'assistant', text: 'Error contacting AI service.' }]);
    } finally {
      setLoading(false);
    }
  };

  const recommend = async (context) => {
    setLoading(true);
    try {
      const res = await axios.post('/ai/recommend', { context });
      const recs = res.data?.recommended || [];
      if (recs && recs.length) {
        setMessages((m) => [...m, { role: 'assistant', text: 'Here are some recommendations:', recommendations: recs }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: 'No recommendations found.' }]);
      }
    } catch (err) {
      console.error('Recommend error', err);
      setMessages((m) => [...m, { role: 'assistant', text: 'Error fetching recommendations.' }]);
    } finally {
      setLoading(false);
    }
  };

  // keyboard send
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const addToCart = useCartStore((s) => s.addToCart);

  const RecommendationCard = ({ product, onAdd }) => {
    const [adding, setAdding] = useState(false);
    const handleAdd = async () => {
      setAdding(true);
      // normalize product shape to ensure _id is present
      const normalized = {
        _id: product._id || product.id,
        id: product.id || product._id || product.id,
        name: product.name || 'Unknown product',
        price: product.price || 0,
        image: product.image || product.imageUrl || '',
        description: product.description || '',
        quantity: 1,
        ...product,
      };
      try {
        await onAdd(normalized);
      } catch (e) {
        // ignore - addToCart shows toast
      } finally {
        setAdding(false);
      }
    };

    return (
      <div className="p-2 border rounded bg-emerald-50 flex items-center gap-2">
  {product.image && <img loading="lazy" src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />}
        <div className="flex-1">
          <div className="font-semibold">{product.name}</div>
          <div className="text-sm">Price: ${product.price}</div>
          {product.avgRating != null && <div className="text-sm">Rating: {product.avgRating} / 5</div>}
        </div>
        <div>
          <button onClick={handleAdd} disabled={adding} className="bg-emerald-600 text-white px-3 py-1 rounded">
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    );
  };

  if (!open) return null;

  // ensure document exists (server-side safe)
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-end pointer-events-auto">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative m-4 w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-3 border-b flex justify-between items-center bg-emerald-50">
          <strong>Support & Recommendations</strong>
          <button onClick={onClose} className="text-gray-600">Close</button>
        </div>
        <div ref={containerRef} className="p-3 h-60 overflow-auto space-y-2 bg-white">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
              <div className={`inline-block p-2 rounded ${m.role === 'user' ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                {m.text}
                {m.product && (
                  <div className="mt-2 text-sm text-gray-700">
                    <div><strong>{m.product.name}</strong></div>
                    <div>Price: ${m.product.price}</div>
                    {m.product.avgRating != null && <div>Rating: {m.product.avgRating} / 5</div>}
                  </div>
                )}
                {m.recommendations && (
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {m.recommendations.map((r, idx) => (
                      <RecommendationCard key={idx} product={r} onAdd={addToCart} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              className="flex-1 border rounded px-2 py-1 resize-none"
              placeholder="Ask about sizing, shipping, or ask for recommendations..."
            />
            <button onClick={() => send()} disabled={loading} className="bg-emerald-600 text-white px-3 py-1 rounded">Send</button>
          </div>
          <div className="mt-2 text-sm text-gray-600 flex gap-2">
            <button onClick={() => recommend('I want something for a beach trip')} className="underline">Recommend for beach trip</button>
            <button onClick={() => recommend('Looking for a gift for a 25 year old')} className="underline">Recommend gift</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChatWidget;
