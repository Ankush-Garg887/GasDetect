# GasGuard — Gas Detection & Cylinder Management System

A full-stack web application for real-time gas detection monitoring and industrial cylinder lifecycle management, built for NodeMCU (ESP8266) IoT hardware.

![Tech Stack](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen) ![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-orange) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS_v3-cyan)

---

## 📋 Features

### 🖥️ Live Dashboard
- Animated SVG gauge with color zones (safe → warning → danger)
- Real-time PPM readings via Socket.io
- Multi-sensor support
- Mini line chart (last 30 minutes)
- Cylinder status summary

### 🛢️ Cylinder Management
- Add/Edit/Delete cylinders with full lifecycle tracking
- Automated depletion estimation engine
- Color-coded urgency badges (Green/Yellow/Red)
- QR code per cylinder
- Refill logging with history
- CSV & PDF export

### 🔔 Alerts & Notifications
- Gas level alert log with acknowledge
- Cylinder depletion alerts (30/15/7/2 days)
- Sound alarm toggle
- Alert statistics

### 📊 Analytics & History
- Gas PPM over time (1h / 6h / 24h / 7d / 30d)
- Daily average bar charts
- Hourly heatmap patterns
- Cylinder days-remaining comparison
- Data export

### 🔧 Maintenance & Safety
- Inspection scheduling per cylinder
- Daily/Weekly safety checklists
- PDF safety report generation
- Checklist history

### ⚙️ Settings
- User profile management
- NodeMCU endpoint configuration
- Per-gas-type threshold editor
- System logs viewer (last 50 requests)
- Dark mode toggle

---

## 🏗️ Project Structure

```
Gas Detect Web/
├── client/                  ← React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/      ← Reusable UI components
│   │   ├── context/         ← Auth, Theme, Socket providers
│   │   ├── pages/           ← 7 page components
│   │   └── index.css        ← Design system
│   └── vite.config.js
│
├── server/                  ← Node.js + Express API
│   ├── config/              ← Database connection
│   ├── controllers/         ← Route handlers
│   ├── cron/                ← Daily background tasks
│   ├── middleware/           ← Auth & role guard
│   ├── models/              ← Mongoose schemas
│   ├── routes/              ← Express routes
│   ├── utils/               ← Depletion engine, socket handler
│   └── server.js            ← Entry point
│
├── hardware/
│   └── nodemcu_gas_sensor.ino  ← Arduino sketch
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** running locally or MongoDB Atlas account
- **Arduino IDE** (for NodeMCU sketch)

### 1. Clone the Project

```bash
cd "e:\Gas Detect Web"
```

### 2. Setup Backend

```bash
cd server

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
# MONGODB_URI=mongodb://localhost:27017/gasdetect
# JWT_SECRET=your_secret_key

# Start the server
npm run dev
```

The backend will start on `http://localhost:5000`.

### 3. Setup Frontend

```bash
cd client

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will start on `http://localhost:5173`.

### 4. Create Your First Account

1. Open `http://localhost:5173` in your browser
2. Click "Create Account"
3. Register with role **Admin** to access all features
4. Login and explore the dashboard

---

## 🔌 Connecting the NodeMCU

### Hardware Wiring

| NodeMCU Pin | Connection |
|-------------|------------|
| A0 | MQ-2/MQ-7/MQ-135 Analog Out |
| 3V3 | Sensor VCC |
| GND | Sensor GND |
| D4 (GPIO2) | Onboard LED (built-in) |

### Uploading the Sketch

1. Open `hardware/nodemcu_gas_sensor.ino` in Arduino IDE
2. Install required libraries:
   - **ESP8266WiFi** (built-in with ESP8266 board package)
   - **ESP8266HTTPClient** (built-in)
   - **ArduinoJson** v6+ (install via Library Manager)
3. Configure:
   ```cpp
   const char* WIFI_SSID     = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* SERVER_URL    = "http://YOUR_PC_IP:5000/api/sensor/data";
   const char* SENSOR_ID     = "MCU-01";
   const char* GAS_TYPE      = "LPG";
   ```
4. Select Board: **NodeMCU 1.0 (ESP-12E Module)**
5. Select Port and Upload

### Verifying Connection

Once uploaded, the NodeMCU will:
- Connect to your WiFi
- Warm up the gas sensor (20 seconds)
- Start sending readings every 2 seconds
- You'll see data appear on the Dashboard in real-time

Check the **Settings → System Logs** page to verify incoming HTTP requests.

---

## 🔒 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Sensor Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sensor/data` | NodeMCU posts readings (no auth) |
| GET | `/api/sensor/latest` | Latest reading per sensor |
| GET | `/api/sensor/history` | Historical readings |

### Cylinders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cylinders` | List all |
| POST | `/api/cylinders` | Add (admin only) |
| PUT | `/api/cylinders/:id` | Edit (admin only) |
| DELETE | `/api/cylinders/:id` | Delete (admin only) |
| PUT | `/api/cylinders/:id/refill` | Refill (admin only) |
| GET | `/api/cylinders/depletion-summary` | Urgency summary |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | Alert log |
| GET | `/api/alerts/stats` | Statistics |
| PUT | `/api/alerts/:id/ack` | Acknowledge |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/gas` | Gas sensor analytics |
| GET | `/api/analytics/cylinders` | Cylinder analytics |
| GET | `/api/analytics/export` | Export data |

### Settings & Maintenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/api/settings` | User settings |
| GET/POST | `/api/maintenance/schedules` | Inspection schedules |
| GET/POST | `/api/maintenance/checklists` | Safety checklists |

---

## ⏰ Cron Jobs

| Schedule | Task |
|----------|------|
| Every midnight | Recalculate all cylinder depletion estimates |
| Every 6 hours | Check and create depletion alerts |

The cron job uses a rolling 7-day average of sensor data to auto-correct consumption rate estimates.

---

## 🎨 Design

- **Theme**: Dark navy (#0a0e27) with electric blue (#3b82f6) accents
- **Font**: Inter (Google Fonts)
- **Cards**: Glassmorphism with backdrop blur
- **Animations**: Smooth gauge needle, progress bar transitions, toast notifications
- **Responsive**: Works on mobile, tablet, and desktop

---

## 📄 License

MIT License — Free to use and modify for personal and commercial projects.
>>>>>>> 4042dd8 (First Commit)
