import mongoose from 'mongoose';
import request from 'supertest';
import { OrderStatus } from '@iptickets/common';
import { app } from '../../app';
 // imports from local dir not setup
 // importing realistic testing with 
 // real stripe API, takes longer
import { stripe } from '../../stripe';
import { Payment } from '../../models/payment';
import { Order } from '../../models/order';

import { natsWrapper } from "../../nats-wrapper";

// need to rename ../../stripe to .old in order to pass tests
// jest.mock('../../stripe');

it('returns a 404 when purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'asldkfj',
      orderId: new mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404);
});

it('returns a 401 when purchasing an order that doesnt belong to the user', async () => {
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 20,
    status: OrderStatus.Created,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: 'asldkfj',
      orderId: order.id,
    })
    .expect(401);
});

it('returns a 400 when purchasing a cancelled order', async () => {
  
  // create a new order with a signed in user created
  const userId = new  mongoose.Types.ObjectId().toHexString();
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price: 20,
    status: OrderStatus.Cancelled,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      orderId: order.id,
      token: 'asdlkfj',
    })
    .expect(400);
});

it('returns a 201 with valid inputs', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const price = Math.floor(Math.random() * 100000);
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price,
    status: OrderStatus.Created,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(201);

  const stripeCharges = await stripe.charges.list({ limit: 50 });
  const stripeCharge = stripeCharges.data.find((charge) => {
    return charge.amount === price * 100;
  });

  // checks also specifically for the value to NOT be undefined
  expect(stripeCharge).toBeDefined();
  expect(stripeCharge!.currency).toEqual('usd');

  // findOne returns value or null. null and udnefined are different
  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id,
  });
  // expect(payment).toBeDefined(); alwasy passes
  expect(payment).not.toBeNull();
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

// it('emits an order created event', async () => {
//   const ticket = Ticket.build({
//     id: new mongoose.Types.ObjectId().toHexString(),
//     title: 'concert',
//     price: 20,
//   });
//   await ticket.save();

//   await request(app)
//     .post('/api/orders')
//     .set('Cookie', global.signin())
//     .send({ ticketId: ticket.id})
//     .expect(201);

//   expect(natsWrapper.client.publish).toHaveBeenCalled();
// });

// it('returns a 201 with valid inputs', async () => {
//   const userId = new mongoose.Types.ObjectId().toHexString();
//   const dollarAmount = 20;
//   const order = Order.build({
//     id: new mongoose.Types.ObjectId().toHexString(),
//     userId,
//     version: 0,
//     price: dollarAmount,
//     status: OrderStatus.Created,
//   });
//   await order.save();

//   await request(app)
//     .post('/api/payments')
//     .set('Cookie', global.signin(userId))
//     .send({
//       token: 'tok_visa',
//       orderId: order.id,
//     })
//     .expect(201);

//   const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
//   expect(chargeOptions.source).toEqual('tok_visa');
//   expect(chargeOptions.amount).toEqual(dollarAmount * 100);
//   expect(chargeOptions.currency).toEqual('usd');
// });
