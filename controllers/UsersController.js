import crypto from 'crypto';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if user already exists
      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password using SHA1
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Create new user
      const result = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
      const newUser = result.ops[0]; // MongoDB 3.6 and later

      // Return the new user
      res.status(201).json({
        id: newUser._id,
        email: newUser.email
      });
    } catch (error) {
      console.error('Error creating user', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;
