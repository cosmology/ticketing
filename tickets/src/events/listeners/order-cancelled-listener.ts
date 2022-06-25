import mongoose from 'mongoose';
import { Listener, OrderCancelledEvent, Subjects } from '@iptickets/common';
import { Message } from 'node-nats-streaming';
import { queueGroupName } from './queue-group-name';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    try {
      // wrap this in try catch since sometimes we have issues
      // in findById call and never reach bellow throw
      const ticket = await Ticket.findById(data.ticket.id);
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      ticket.set({ orderId: undefined });
      await ticket.save();
      await new TicketUpdatedPublisher(this.client).publish({
        id: ticket.id,
        orderId: ticket.orderId,
        userId: ticket.userId,
        price: ticket.price,
        title: ticket.title,
        version: ticket.version,
      });
    } catch (error) {
      console.log( error);
    }

    msg.ack();
  }
}
