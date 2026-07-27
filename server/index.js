require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const meterRoutes = require('./routes/meters');
const readingRoutes = require('./routes/readings');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded photos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Sample static directory
const sampleDir = path.join(__dirname, '../sample_images');
if (fs.existsSync(sampleDir)) {
  app.use('/sample_images', express.static(sampleDir));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/meters', meterRoutes);
app.use('/api/readings', readingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static build in production & SPA fallback
const possibleDistPaths = [
  path.resolve(__dirname, '../dist'),
  path.resolve(process.cwd(), 'dist'),
  '/app/dist'
];
const distDir = possibleDistPaths.find(p => fs.existsSync(p));

if (distDir) {
  console.log(`Serving frontend static build from: ${distDir}`);
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(distDir, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Water Meter Manager Server running on http://localhost:${PORT}`);
});
