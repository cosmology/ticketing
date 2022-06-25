import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { validateRequest, BadRequestError } from '@iptickets/common';
import { User } from '../models/user';

const router = express.Router();

router.post(
  '/api/users/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Email must be valid'),
    body('password')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Password must be between 4 and 20 characters')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    // Make sure email is not in use
    if (existingUser) {
      throw new BadRequestError('Email in use');
    }

    // Create and save a user if not in use
    const user = User.build({ email, password });
    await user.save();

    // Generate JWT
    const userJwt = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_KEY!
    );

    // Store it on session object and will be turned into a string
    // by cookie session. Cookie sesssion middleware will send this 
    // cookie back to the users browser in hte header 'Set-Cookie'
    req.session = {
      jwt: userJwt
    };

    // console.log(req.session);

    res.status(201).send(user);
  }
);

export { router as signUpRouter };
