import { jest } from '@jest/globals';

// Mock gemini, Product, and Feedback before importing controller
await jest.unstable_mockModule('../lib/gemini.js', async () => {
  return {
    default: {
      callGemini: jest.fn(async () => { throw new Error('gemini not available in tests'); }),
    },
  };
});

await jest.unstable_mockModule('../models/product.model.js', async () => {
  const mock = {
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn().mockResolvedValue(null),
    findOne: jest.fn().mockResolvedValue(null),
  };
  return { default: mock };
});

await jest.unstable_mockModule('../models/feedback.model.js', async () => {
  const mock = { find: jest.fn().mockResolvedValue([]) };
  return { default: mock };
});

const { chatWithAgent, recommendProducts } = await import('../controllers/ai.controller.js');
const Product = (await import('../models/product.model.js')).default;
const Feedback = (await import('../models/feedback.model.js')).default;
const gemini = (await import('../lib/gemini.js')).default;

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('AI controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns payment help with product info when message mentions product', async () => {
    // Arrange: mock product lookup and feedback
    const product = { _id: '64b7f0c0c0c0c0c0c0c0c0c0', name: 'Blue Jacket', price: 89.99 };
    Product.findById = jest.fn().mockResolvedValue(product);
    Product.find = jest.fn().mockResolvedValue([product]);
    Feedback.find = jest.fn().mockResolvedValue([{ product: product._id, rating: 5 }, { product: product._id, rating: 4 }]);

    const req = { body: { message: `I tried to pay for ${product._id} and it failed` } };
    const res = mockRes();

    // Act
    await chatWithAgent(req, res);

    // Assert
    expect(res.json).toHaveBeenCalled();
    const callArg = res.json.mock.calls[0][0];
    expect(callArg.reply).toBeDefined();
    expect(callArg.reply.product).toBeDefined();
    expect(callArg.reply.product.price).toBe(product.price);
    expect(callArg.fallback).toBe(true);
  });

  test('recommendProducts falls back when gemini and DB fail', async () => {
    // Simulate DB and gemini failures
    Product.find = jest.fn().mockImplementation(() => { throw new Error('DB down'); });
    gemini.callGemini = jest.fn().mockImplementation(() => { throw new Error('gemini down'); });

    const req = { body: { context: 'beach trip' } };
    const res = mockRes();

    await recommendProducts(req, res);

    expect(res.json).toHaveBeenCalled();
    const arg = res.json.mock.calls[0][0];
    expect(Array.isArray(arg.recommended)).toBe(true);
    expect(arg.recommended.length).toBeGreaterThan(0);
    expect(arg.fallback).toBe(true);
  });
});
