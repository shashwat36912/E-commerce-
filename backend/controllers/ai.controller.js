import gemini from '../lib/gemini.js';
import cloudinary from '../lib/cloudinary.js';
import axios from 'axios';

function capitalizeFirstLetter(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
import Product from '../models/product.model.js';
import Feedback from '../models/feedback.model.js';

// Simple keyword detection for payment-related intents
function looksLikePaymentIssue(text) {
  if (!text) return false;
  const lowered = text.toLowerCase();
  return [
    'payment',
    'card',
    'checkout',
    'billing',
    'charge',
    'paid',
    'transaction',
    'declined',
    'failed',
  ].some((kw) => lowered.includes(kw));
}

// Simple fuzzy product matcher: tokenize message and score products by token matches
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function scoreProductAgainstTokens(product, tokens) {
  let score = 0;
  const name = (product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  tokens.forEach((t) => {
    if (name.includes(t)) score += 3;
    if (category.includes(t)) score += 2;
    if (desc.includes(t)) score += 1;
  });
  return score;
}

export const chatWithAgent = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // Build a simple prompt: include last few messages if provided in session
    const payload = {
      model: 'gemini-pro',
      prompt: message,
      max_tokens: 400,
      temperature: 0.2,
      session: sessionId || undefined,
    };

    // Payment-related quick help: detect and return canned troubleshooting + price info
    if (looksLikePaymentIssue(message)) {
      // Try to detect a product mention (by id or simple name match)
      let productInfo = null;
      try {
        // attempt find by id substring
        const idMatch = message.match(/\b[0-9a-fA-F]{24}\b/);
        if (idMatch) {
          const p = await Product.findById(idMatch[0]).lean();
          if (p) productInfo = p;
        }
        if (!productInfo) {
          // fallback: use fuzzy matching across products we loaded earlier
          const best = findBestMatches(message, 1);
          if (best && best.length) {
            const maybe = await Product.findById(best[0].id).lean();
            if (maybe) productInfo = maybe;
          }
        }
      } catch (err) {
        console.warn('Product lookup during payment help failed', err?.message || err);
      }

      const steps = [
        'Confirm your card details (number, expiry, CVV) are correct.',
        'Ensure your billing address matches the card billing address.',
        'Try another card or payment method (Stripe, PayPal, etc.).',
        'Check with your bank for any declined transactions or holds.',
        'If the issue persists, contact support@yourstore.example with a screenshot of the error.',
      ];

      const reply = {
        text: `It looks like a payment/checkout issue. Here are some steps:\n- ${steps.join('\n- ')}`,
      };

      if (productInfo) {
        // include price and average rating if available
        const feedbacks = await Feedback.find({ product: productInfo._id }).lean();
        let avgRating = null;
        if (feedbacks && feedbacks.length) {
          const sum = feedbacks.reduce((s, f) => s + (f.rating || 0), 0);
          avgRating = +(sum / feedbacks.length).toFixed(2);
        }
        reply.product = { id: productInfo._id.toString(), name: productInfo.name, price: productInfo.price, avgRating };
      }

      return res.json({ reply, fallback: true });
    }

    // Try to call Gemini; if GEMINI_API_KEY isn't set or call fails, provide a fallback
    try {
      const response = await gemini.callGemini('/v1/generate', payload);
      return res.json({ reply: response });
    } catch (err) {
      console.warn('Gemini unavailable; returning fallback chat reply', err?.message || err);
      // Very simple canned fallback
      const fallback = { text: "Thanks for your message. Our support team will follow up shortly. Meanwhile, check our FAQ or product pages." };
      return res.json({ reply: fallback, fallback: true });
    }
  } catch (error) {
    console.error('AI chat error', error?.message || error);
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
};

export const recommendProducts = async (req, res) => {
  try {
    const { userId, context } = req.body;

    // Use a lightweight approach: fetch some products and ask Gemini to rank/choose
    let products = [];
    try {
      products = await Product.find({}).limit(20).lean();
    } catch (dbErr) {
      console.warn('Product DB fetch failed, recommend will use fallback list', dbErr?.message || dbErr);
      products = [];
    }

    let simplified = [];
    if (products && products.length > 0) {
      // enrich products with average rating
      const feedbacks = await Feedback.find({ product: { $in: products.map((p) => p._id) } }).lean();
      const ratingMap = {};
      feedbacks.forEach((f) => {
        const id = f.product.toString();
        ratingMap[id] = ratingMap[id] || { sum: 0, count: 0 };
        ratingMap[id].sum += (f.rating || 0);
        ratingMap[id].count += 1;
      });

      simplified = products.map((p) => {
        const id = p._id.toString();
        const ratingEntry = ratingMap[id];
        const avgRating = ratingEntry ? +(ratingEntry.sum / ratingEntry.count).toFixed(2) : null;
        return { id, name: p.name, price: p.price, category: p.category, avgRating, image: p.image };
      });
    } else {
      // minimal fallback product list when DB is unreachable
      simplified = [
        { id: 'fallback-1', name: 'Classic T-shirt', price: 19.99, category: 'tshirts', avgRating: 4.2 },
        { id: 'fallback-2', name: 'Stylish Jeans', price: 49.99, category: 'jeans', avgRating: 4.5 },
        { id: 'fallback-3', name: 'Running Shoes', price: 79.99, category: 'shoes', avgRating: 4.1, image: '' },
        { id: 'fallback-4', name: 'Casual Jacket', price: 99.99, category: 'jackets', avgRating: 4.0, image: '' },
      ];
    }

    // Helper: return best matches from simplified by fuzzy match
    function findBestMatches(message, max = 5) {
      const tokens = tokenize(message);
      if (!tokens.length) return [];
      const scored = simplified.map((p) => ({ p, score: scoreProductAgainstTokens(p, tokens) }));
      scored.sort((a, b) => b.score - a.score);
      return scored.filter(s => s.score > 0).slice(0, max).map(s => s.p);
    }

    const prompt = `You are a helpful e-commerce assistant. Given the user context: ${context || 'no context'}, choose 4 product ids from the list that best match the user's needs. Return a JSON array of chosen ids in order of relevance. Products: ${JSON.stringify(simplified)}`;

    const payload = {
      model: 'gemini-recommend',
      prompt,
      max_tokens: 200,
      temperature: 0.0,
    };

    // Try to call Gemini; if it fails, fall back to random selection
    let aiResult = null;
    try {
      aiResult = await gemini.callGemini('/v1/generate', payload);
    } catch (err) {
      console.warn('Gemini call failed for recommendations, falling back to random products', err?.message || err);
      const fallbackProducts = simplified.sort(() => 0.5 - Math.random()).slice(0, 4);
      return res.json({ recommended: fallbackProducts, raw: null, fallback: true });
    }

    // Expect aiResult contains the text with a JSON array; attempt to parse
    let chosenIds = [];
    try {
      const text = aiResult?.text || JSON.stringify(aiResult);
      const match = text.match(/\[.*\]/s);
      if (match) chosenIds = JSON.parse(match[0]);
    } catch (e) {
      console.warn('Failed to parse AI response for recommendations', e.message);
    }

    // Map ids back to products
    const recommended = simplified.filter((p) => chosenIds.includes(p.id)).slice(0, 4);

    // If AI couldn't pick any, fall back to a random selection
    if (!recommended || recommended.length === 0) {
      const fallbackProducts = simplified.sort(() => 0.5 - Math.random()).slice(0, 4);
      return res.json({ recommended: fallbackProducts, raw: aiResult, fallback: true });
    }

    return res.json({ recommended, raw: aiResult });
  } catch (error) {
    console.error('Recommend error', error?.message || error);
    res.status(500).json({ message: 'AI service error', error: error.message });
  }
};

