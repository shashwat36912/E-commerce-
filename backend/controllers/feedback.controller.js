import Feedback from "../models/feedback.model.js";

export const createFeedback = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userName, rating, comment } = req.body;

    if (!userName || !comment) {
      return res.status(400).json({ message: 'userName and comment are required' });
    }

    // req.user is set by protectRoute middleware
    const authorId = req.user && req.user._id;
    if (!authorId) return res.status(401).json({ message: 'Unauthorized' });

    const feedback = await Feedback.create({ product: productId, author: authorId, userName, rating, comment });
    res.status(201).json(feedback);
  } catch (error) {
    console.log('Error in createFeedback', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getFeedbacksByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    // populate author basic fields for frontend to determine ownership/admin actions
  // include _id explicitly to make ownership checks easier on frontend
  const feedbacks = await Feedback.find({ product: productId }).sort({ createdAt: -1 }).populate('author', '_id name role isAdmin');
    res.json({ feedbacks });
  } catch (error) {
    console.log('Error in getFeedbacksByProduct', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const fb = await Feedback.findById(id);
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });
    // Allow delete if requester is admin or the original author
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    const isAdmin = Boolean(requester.isAdmin) || requester.role === 'admin';
    if (String(fb.author) !== String(requester._id) && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Feedback.findByIdAndDelete(id);
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    console.log('Error in deleteFeedback', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
