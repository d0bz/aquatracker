# 💧 AquaTracker — Smart Water Meter Management & AI OCR System

AquaTracker is a modern full-stack web application designed for property owners and tenants to effortlessly manage water meters, log meter readings, extract digits automatically using Gemini Vision AI, and dispatch consolidated email reports to property owners via real SMTP.

---

## ✨ Features

- **Multi-Tenant & Property Owner Dashboards**:
  - **Property Owners**: Manage properties, attach tenants by email, create labeled water meters (Tag #1, #2, #3...), and audit complete historical readings with consumption analytics charts.
  - **Tenants**: View assigned unit meters, log single or batch meter readings, and trigger consolidated monthly summary reports to their landlord.

- **🤖 Gemini Vision AI OCR**:
  - Automatic extraction of numeric digits from water meter counter displays.
  - Handwritten Tag detection (e.g., `#1`, `#2`, `#3`) to auto-route uploaded photos to the correct water meter.

- **📸 Instant Manual & Batch Photo Upload**:
  - Support for single meter uploads with immediate numeric value entry.
  - **Bunch Upload (1 to N)**: Upload multiple meter photos simultaneously with drag-and-drop auto-routing.

- **📧 Real SMTP Email Reports**:
  - Consolidated multi-meter reports sent directly to property owners via Hostinger Nodemailer SMTP.
  - Includes previous reading values, dates recorded, net consumption deltas, and direct links to photo evidence.

- **🐳 Docker & Production Ready**:
  - Containerized with Docker and Docker Compose.
  - Standalone SQLite database with foreign key cascades and lightweight footprint.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Lucide Icons, Chart.js (`react-chartjs-2`), Vanilla CSS (Custom Design Token System)
- **Backend**: Node.js, Express, Better-SQLite3
- **AI OCR**: Google Gemini Vision API (`@google/genai`)
- **Email Dispatch**: Nodemailer (Hostinger SMTP)
- **Containerization**: Docker, Docker Compose

---

## 🚀 Getting Started Locally

### Prerequisites

- Node.js (v18+)
- npm or yarn

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:d0bz/aquatracker.git
cd aquatracker
npm install
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=YOUR_GEMINI_VISION_API_KEY

# SMTP Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=hi@groupfund.eu
SMTP_PASSWORD=YOUR_SMTP_PASSWORD
SMTP_FROM_EMAIL=hi@groupfund.eu
SMTP_FROM_NAME=AquaTrack Water Meters
```

### 3. Run Development Server

Start both the backend API server (`port 3001`) and Vite dev server (`port 3000`) concurrently:

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

---

## 🐳 Docker Deployment

### Run with Docker Compose

```bash
docker compose up -d --build
```

The app will be accessible on `http://localhost:8095` (or configured container port).

---

## 📄 License

MIT License. Designed with ❤️ by the AquaTracker Team.
