import Bull from 'bull';
import fs from 'fs';
import path from 'path';
import imageThumbnail from 'image-thumbnail';
import dbClient from './utils/db';
import { ObjectId } from 'mongodb';

const fileQueue = new Bull('fileQueue', {
  redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT },
});

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId });

  if (!file) throw new Error('File not found');

  if (file.type !== 'image') throw new Error('Not an image file');

  const filePath = path.join(process.env.FOLDER_PATH, file.localPath);
  if (!fs.existsSync(filePath)) throw new Error('File not found');

  try {
    const sizes = [100, 250, 500];
    for (const size of sizes) {
      const thumbnail = await imageThumbnail(filePath, { width: size });
      const thumbnailPath = path.join(process.env.FOLDER_PATH, `${fileId}_${size}`);
      fs.writeFileSync(thumbnailPath, thumbnail);
    }
  } catch (err) {
    console.error('Error generating thumbnail:', err);
  }
});

console.log('Thumbnail worker started');
