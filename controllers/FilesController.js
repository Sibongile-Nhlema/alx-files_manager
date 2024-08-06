import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

if (!fs.existsSync(FOLDER_PATH)) {
  fs.mkdirSync(FOLDER_PATH, { recursive: true });
}

class FilesController {
  // Handle file upload
  static async postUpload(req, res) {
    // Retrieve token from headers
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user ID from Redis
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get file details from request body
    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Validate parentId if provided
    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Handle file types
    let localPath = null;
    if (type !== 'folder') {
      const fileId = uuidv4();
      localPath = path.join(FOLDER_PATH, fileId);

      // Write file data to local storage
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, buffer);
    }

    try {
      // Create new file document
      const fileDocument = {
        userId,
        name,
        type,
        parentId: new ObjectId(parentId),
        isPublic,
        localPath: localPath || null,
      };

      // Insert new file document into the db
      const result = await dbClient.db.collection('files').insertOne(fileDocument);
      const newFile = result.ops[0];

      // Respond with the new file
      res.status(201).json(newFile);
    } catch (err) {
      console.error('Error during file upload:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /files/:id
  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    try {
      const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id), userId });
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.status(200).json(file);
    } catch (err) {
      console.error('Error fetching file:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /files
  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = 0, page = 0 } = req.query;
    const limit = 20; // Max items per page
    const skip = page * limit;

    try {
      const files = await dbClient.db.collection('files')
        .find({ userId, parentId: new ObjectId(parentId) })
        .skip(skip)
        .limit(limit)
        .toArray();
      res.status(200).json(files);
    } catch (err) {
      console.error('Error fetching files:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /files/:id/publish
  static async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    try {
      const result = await dbClient.db.collection('files').findOneAndUpdate(
        { _id: new ObjectId(id), userId },
        { $set: { isPublic: true } },
        { returnOriginal: false }
      );

      if (!result.value) {
        return res.status(404).json({ error: 'Not found' });
      }

      res.status(200).json(result.value);
    } catch (err) {
      console.error('Error publishing file:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /files/:id/unpublish
  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    try {
      const result = await dbClient.db.collection('files').findOneAndUpdate(
        { _id: new ObjectId(id), userId },
        { $set: { isPublic: false } },
        { returnOriginal: false }
      );

      if (!result.value) {
        return res.status(404).json({ error: 'Not found' });
      }

      res.status(200).json(result.value);
    } catch (err) {
      console.error('Error unpublishing file:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /files/:id/data
  static async getFile(req, res) {
    const token = req.headers['x-token'];
    const { id } = req.params;

    try {
      // Retrieve the user based on the token
      if (token) {
        const key = `auth_${token}`;
        const userId = await redisClient.get(key);

        if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if the file document exists and is linked to the user
        const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id), userId });

        if (!file) {
          return res.status(404).json({ error: 'Not found' });
        }

        // Check if the file is public or if the user is the owner
        if (!file.isPublic && file.userId !== userId) {
          return res.status(404).json({ error: 'Not found' });
        }

        // Check if the file type is a folder
        if (file.type === 'folder') {
          return res.status(400).json({ error: 'A folder doesn’t have content' });
        }

        // Check if the file is locally present
        if (file.localPath && fs.existsSync(file.localPath)) {
          const fileContent = fs.readFileSync(file.localPath);
          const mimeType = mime.lookup(file.name) || 'application/octet-stream';
          res.setHeader('Content-Type', mimeType);
          res.status(200).send(fileContent);
        } else {
          return res.status(404).json({ error: 'Not found' });
        }
      } else {
        // If no token is provided, check for public files
        const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(id) });

        if (!file) {
          return res.status(404).json({ error: 'Not found' });
        }

        if (!file.isPublic) {
          return res.status(404).json({ error: 'Not found' });
        }

        if (file.type === 'folder') {
          return res.status(400).json({ error: 'A folder doesn’t have content' });
        }

        if (file.localPath && fs.existsSync(file.localPath)) {
          const fileContent = fs.readFileSync(file.localPath);
          const mimeType = mime.lookup(file.name) || 'application/octet-stream';
          res.setHeader('Content-Type', mimeType);
          res.status(200).send(fileContent);
        } else {
          return res.status(404).json({ error: 'Not found' });
        }
      }
    } catch (err) {
      console.error('Error retrieving file data:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default FilesController;
