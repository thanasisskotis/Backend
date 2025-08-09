import 'dotenv/config';
import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

// ✅ Upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
  const { date } = req.body; // ✅ Extract the date directly
  console.log("✅ Upload endpoint hit");
  console.log("date:", date);
  console.log("Uploaded file:", req.file);

  if (!req.file) {
    console.error("❌ No file received");
    return res.status(400).json({ success: false, message: "No file received" });
  }

  try {
    // Use date as folder name
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: date, // ✅ Folder = date
    });

    fs.unlinkSync(req.file.path); // Clean temp file

    console.log("✅ Upload successful:", result.secure_url);
    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      date // Return date so frontend can update without reload
    });

  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Fetch all boxes (folders) with date info
app.get('/boxes', async (req, res) => {
  try {
    const result = await cloudinary.api.sub_folders('');

    // Each folder name is assumed to be a date string (ISO or readable)
    const boxes = (result.folders || []).map(f => ({
      id: f.name,        // Folder name acts as box ID
      date: f.name       // Same as ID since folder = date
    }));

    res.json({ success: true, boxes });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Fetch all images for a box
app.get('/images/:boxId', async (req, res) => {
  const boxId = req.params.boxId;
  console.log("📥 Fetching images for box:", boxId);

  try {
    const response = await cloudinary.api.resources({
      type: 'upload',
      prefix: `${boxId}/`, // ✅ boxId is the folder name (date)
      max_results: 200,
    });

    const images = response.resources.map(img => ({
      url: img.secure_url,
      public_id: img.public_id,
    }));

    console.log(`✅ Fetched ${images.length} images for box ${boxId}`);
    res.json({ success: true, images });

  } catch (error) {
    console.error("❌ Failed to fetch images:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
