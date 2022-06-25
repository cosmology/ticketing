import express, { Request, Response } from 'express';
import { requireAuth } from '@iptickets/common';
import { Order } from '../models/order';

const router = express.Router();

// this route will be available only if authenticated
// this roud will have to list the collection of la all order
router.get('/api/orders', requireAuth, async (req: Request, res: Response) => {
  const orders = await Order.find({ 
    userId: req.currentUser!.id
  }).populate('ticket');
  
  res.send(orders);
});

export { router as indexOrderRouter };
