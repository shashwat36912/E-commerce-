import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";

const ChatWidget = ({ open, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef();
  const inputRef = useRef();
  const addToCart = useCartStore((s) => s.addToCart);

  // Welcome message when opened
  useEffect(() => {
    if (open) {
      setMessages([
        {
          role: "assistant",
          text: "Hi 👋 I can help recommend products or answer your questions. Ask me anything!",
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (overrideText) => {
    const textToSend = overrideText ?? input.trim();
    if (!textToSend) return;
    const userMsg = { role: "user", text: textToSend };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post("/ai/chat", { message: textToSend });
      const reply = res.data?.reply;
      const assistantMsg = reply?.product
        ? { role: "assistant", text: reply.text, product: reply.product }
        : { role: "assistant", text: reply?.text || String(res.data?.reply ?? "Sorry, no response") };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      console.error("Chat error", err);
      setMessages((m) => [...m, { role: "assistant", text: "⚠️ Error contacting AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  const recommend = async (context) => {
    setLoading(true);
    try {
      const res = await axios.post("/ai/recommend", { context });
      const recs = res.data?.recommended || [];
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: recs.length ? "Here are some recommendations:" : "No recommendations found.",
          recommendations: recs,
        },
      ]);
    } catch (err) {
      console.error("Recommend error", err);
      setMessages((m) => [...m, { role: "assistant", text: "⚠️ Error fetching recommendations." }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const RecommendationCard = ({ product }) => {
    const [adding, setAdding] = useState(false);
    const handleAdd = async () => {
      setAdding(true);
      const normalized = {
        _id: product._id || product.id,
        name: product.name || "Unnamed product",
        price: product.price || 0,
        image: product.image || product.imageUrl || "",
        description: product.description || "",
        quantity: 1,
        ...product,
      };
      try {
        await addToCart(normalized);
      } finally {
        setAdding(false);
      }
    };
    return (
      <div className="p-2 border rounded-lg bg-emerald-50 flex items-center gap-3 shadow-sm">
        {product.image && (
          <img
            loading="lazy"
            src={product.image}
            alt={product.name}
            className="w-16 h-16 object-cover rounded"
          />
        )}
        <div className="flex-1 text-left">
          <div className="font-semibold">{product.name}</div>
          <div className="text-sm text-gray-700">Price: ${product.price}</div>
          {product.avgRating != null && (
            <div className="text-sm text-gray-700">Rating: {product.avgRating} / 5</div>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={adding}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1 rounded"
        >
          {adding ? "Adding…" : "Add"}
        </button>
      </div>
    );
  };

  const MessageBubble = ({ m }) => (
    <div className={m.role === "user" ? "text-right" : "text-left"}>
      <div
        className={`inline-block px-3 py-2 rounded-2xl shadow-sm max-w-xs break-words ${
          m.role === "user"
            ? "bg-emerald-500 text-gray-900"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {m.text}
        {m.product && (
          <div className="mt-2 text-sm text-gray-700">
            <div className="font-semibold">{m.product.name}</div>
            <div>Price: ${m.product.price}</div>
            {m.product.avgRating != null && <div>Rating: {m.product.avgRating} / 5</div>}
          </div>
        )}
        {m.recommendations && (
          <div className="mt-2 grid gap-2">
            {m.recommendations.map((r, idx) => (
              <RecommendationCard key={idx} product={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end justify-end"
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative m-4 w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b bg-emerald-600 text-white flex justify-between items-center">
              <strong>Support & Recommendations</strong>
              <button
                onClick={onClose}
                className="hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div
              ref={containerRef}
              className="p-4 h-72 overflow-auto space-y-3 bg-gray-50"
            >
              {messages.map((m, i) => (
                <MessageBubble key={i} m={m} />
              ))}
            </div>

            <div className="p-3 border-t bg-white">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  className="flex-1 border text-card rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ask about sizing, shipping, or request recommendations…"
                />
                <button
                  onClick={() => send()}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
                >
                  Send
                </button>
              </div>
              <div className="mt-3 text-sm text-gray-600 flex flex-wrap gap-3">
                <button
                  onClick={() => recommend("I want something for a beach trip")}
                  className="underline hover:text-emerald-700"
                >
                  Recommend for beach trip
                </button>
                <button
                  onClick={() =>
                    recommend("Looking for a gift for a 25 year old")
                  }
                  className="underline hover:text-emerald-700"
                >
                  Recommend gift
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ChatWidget;
