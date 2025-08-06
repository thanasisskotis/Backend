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

  console.log("✅ Upload endpoint hit");
  console.log("boxId:", boxId);
  console.log("Uploaded file:", req.file);

  if (!req.file) {
    console.error("❌ No file received");
    return res.status(400).json({ success: false, message: "No file received" });
  }

  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `box_${boxId}`,
    });

    fs.unlinkSync(req.file.path);

    console.log("✅ Upload successful:", result.secure_url);
    res.json({ success: true, url: result.secure_url, public_id: result.public_id });

  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fetch all images for a box
app.get('/images/:boxId', async (req, res) => {
  const boxId = req.params.boxId;
  console.log("📥 Fetching images for box:", boxId);

  try {
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: `box_${boxId}/`,
      max_results: 200,
    });

    const images = response.resources.map(img => ({
      url: img.secure_url,
      public_id: img.public_id,
    }));

    console.log(`✅ Fetched ${images.length} images for box ${boxId}`);
    res.json(images);

  } catch (error) {
    console.error("❌ Failed to fetch images:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



