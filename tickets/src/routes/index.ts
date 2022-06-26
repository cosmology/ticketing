import express, { Request, Response } from 'express';
import { Ticket } from '../models/ticket';

const router = express.Router();

router.get('/api/tickets', async (req: Request, res: Response) => {
  // give us all tickets inside of this collection
  // and filter by tickets with orderId undefined
  const tickets = await Ticket.find({
    orderId: undefined
  });

  res.send(tickets);
});

export { router as indexTicketRouter };
