import { Request, Response } from 'express';
import { readDB, writeDB } from '../db';
import { Review } from '../../src/types';

// Recalculates average rating and reviews count for a product
function updateProductRatingStats(db: any, productId: string) {
  const product = db.products.find((p: any) => p.id === productId);
  if (!product) return;

  const productReviews = db.reviews.filter((r: any) => r.productId === productId && r.isApproved);
  product.reviewsCount = productReviews.length;

  if (productReviews.length > 0) {
    const totalRating = productReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    product.rating = Number((totalRating / productReviews.length).toFixed(1));
  } else {
    product.rating = 5.0; // default standard rating if no reviews
  }
}

export const createReview = (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userPayload = (req as any).user;

    if (!userPayload) {
      return res.status(401).json({ error: 'Authentication required to submit reviews.' });
    }

    if (rating === undefined || !comment) {
      return res.status(400).json({ error: 'Rating (1-5 stars) and comment text are required.' });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const db = readDB();

    // Verify product exists
    const product = db.products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const newReview: Review = {
      id: 'rev_' + Date.now(),
      productId,
      productName: product.name,
      userId: userPayload.id,
      userName: userPayload.username || 'Valued Customer',
      rating: numericRating,
      comment,
      isApproved: true, // Auto-approve by default for friendly testing experience
      createdAt: new Date().toISOString()
    };

    db.reviews.push(newReview);
    updateProductRatingStats(db, productId);
    writeDB(db);

    res.status(201).json({
      message: 'Review posted successfully!',
      review: newReview
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to post review: ' + err.message });
  }
};

export const getAdminReviews = (req: Request, res: Response) => {
  try {
    const db = readDB();
    res.json(db.reviews);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve reviews: ' + err.message });
  }
};

export const approveReview = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const db = readDB();
    const review = db.reviews.find(r => r.id === id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    review.isApproved = isApproved === true || isApproved === 'true';

    // Recalculate stats for the related product
    updateProductRatingStats(db, review.productId);

    writeDB(db);

    res.json({
      message: `Review ${review.isApproved ? 'approved' : 'unapproved'} successfully!`,
      review
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update review status: ' + err.message });
  }
};

export const deleteReview = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = readDB();

    const reviewIndex = db.reviews.findIndex(r => r.id === id);
    if (reviewIndex === -1) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const productId = db.reviews[reviewIndex].productId;

    db.reviews.splice(reviewIndex, 1);

    // Recalculate product stats
    updateProductRatingStats(db, productId);

    writeDB(db);

    res.json({ message: 'Review deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete review: ' + err.message });
  }
};
