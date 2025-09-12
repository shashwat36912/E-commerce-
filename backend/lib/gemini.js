import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_BASE = process.env.GEMINI_BASE_URL || 'https://api.google.com/gemini';

async function callGemini(endpoint, payload, headers = {}) {
  const url = `${GEMINI_BASE}${endpoint}`;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const res = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...headers,
    },
    timeout: 30000,
  });

  return res.data;
}

export default { callGemini };
