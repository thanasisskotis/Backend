import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import fs from 'fs';

const app = express();
const upload = multer({ dest: 'uploads/' });

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

app.use(express.json());

// Upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
  const { boxId } = req.body;

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `box_${boxId}`, // images organized per box folder
    });
    // Delete temp file after upload
    fs.unlinkSync(req.file.path);

    res.json({ success: true, url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch all images for a box
app.get('/images/:boxId', async (req, res) => {
  const boxId = req.params.boxId;
  try {
    // List all images in that folder
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: `box_${boxId}/`,
      max_results: 200,
    });

    const images = response.resources.map(img => ({
      url: img.secure_url,
      public_id: img.public_id,
    }));

    res.json({ success: true, images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
