# MediQueueAI 🏥

**AI-Powered Smart Hospital Queue Management System**

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](docker-compose.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

MediQueueAI revolutionizes hospital queue management with AI-powered wait time predictions, real-time tracking, and seamless patient flow management.

---

## ✨ Features

### For Patients
- 📱 **Online Booking** - Book appointments from anywhere
- ⏱️ **Real-time Queue Tracking** - Know your exact position
- 🔮 **AI Wait Time Predictions** - Accurate ML-powered estimates
- 📧 **Instant Confirmation** - Get confirmation codes (MQ-XXXXXX)
- ✅ **Self Check-in** - Check in using confirmation code

### For Doctors
- 📊 **Live Dashboard** - Real-time patient queue view
- 👥 **Patient Management** - View patient details before consultation
- ⏰ **Smart Scheduling** - Optimized appointment slots
- 📈 **Performance Analytics** - Track consultation patterns

### For Reception Staff
- 🎫 **Quick Registration** - Fast patient check-in
- 📋 **Queue Management** - Add, remove, prioritize patients
- 🔔 **Alert System** - Notifications for delays
- 📅 **Appointment Overview** - Daily schedule view

### For Administrators
- 👨‍⚕️ **Doctor Management** - Add/edit doctor profiles
- 📊 **System Analytics** - Queue performance metrics
- ⚙️ **Configuration** - Manage system settings
- 👥 **User Management** - Control staff access

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/mediqueueai.git
cd mediqueueai

# Set secure JWT secret
export JWT_SECRET=$(openssl rand -hex 32)

# Build and run (first time or after updates)
docker compose down -v  # Remove old volumes for fresh start
docker compose up --build -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### 🔐 Default Admin Credentials

After installation, login with:
- **Username:** `admin`
- **Password:** `MediQueue@2024`

⚠️ **Change this password immediately after first login!**

### License Activation

After purchasing a license, activate it via:
1. Login as admin
2. Go to Settings → License
3. Enter your license key (format: `MQAI-XXXX-XXXX-XXXX`)
4. Enter your hospital name

### Option 2: Manual Setup

#### Prerequisites
- Bun (v1.0+) or Node.js (v18+)
- Python 3.8+
- SQLite3

#### 1. Database Setup
```bash
# Database auto-initializes on first run with default admin
```

#### 2. ML Models (Optional)
```bash
cd ml
pip install -r requirements.txt
python scripts/generate_data.py
python scripts/train_model.py
cd ..
```

#### 3. Backend
```bash
cd backend
bun install
bun run dev
```

#### 4. Frontend (new terminal)
```bash
cd frontend
bun install
bun run start
```

---

## 🔐 Login Credentials

### Demo Access (via Login Page)
Click the role buttons on the login page for instant demo access:

| Role | Button | Features |
|------|--------|----------|
| **Doctor** | 🔵 Blue | Patient queue, consultation management |
| **Reception** | 🟣 Violet | Patient registration, queue control |
| **Admin** | 🟢 Emerald | Full system access, doctor management |

### Manual Login
If demo buttons don't work (first time), accounts are auto-created with:
- **Username**: `doctor`, `receptionist`, or `admin`
- **Password**: `password123`

### Patient Portal
No login required! Visit `/patient` to:
- Book appointments
- Look up appointments with confirmation code
- Check in for appointments

---

## 📁 Project Structure

```
mediqueueai/
├── backend/                 # Express.js + TypeScript API
│   ├── src/
│   │   ├── app.ts          # Main server entry
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Database & helpers
│   └── package.json
│
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── App.tsx        # Main app with routing
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   └── utils/         # API client
│   └── package.json
│
├── ml/                     # Machine Learning
│   ├── scripts/           # Training & prediction
│   ├── models/            # Trained models
│   └── requirements.txt
│
├── database/
│   ├── migrations/        # Schema files
│   └── seeds/             # Sample data
│
├── Dockerfile             # Multi-stage build
└── docker-compose.yml     # Container orchestration
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | User authentication |
| POST | `/api/register` | New user registration |

### Booking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List all doctors |
| GET | `/api/available-slots/:doctorId` | Get available slots |
| POST | `/api/book` | Book appointment |
| GET | `/api/appointment/:code` | Lookup by confirmation code |
| POST | `/api/checkin/:code` | Self check-in |
| DELETE | `/api/appointment/:code` | Cancel appointment |

### Queue Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/queue-status/:doctorId` | Current queue status |
| POST | `/api/update-slot-time/:doctorId` | Update consultation time |
| GET | `/api/predictions/:doctorId` | ML wait time predictions |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/doctors` | Add new doctor |
| PUT | `/api/admin/doctors/:id` | Update doctor |

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for JWT tokens | (required in production) |
| `PORT` | Backend port | `5000` |
| `DB_PATH` | SQLite database path | `./database/queue.db` |
| `NODE_ENV` | Environment mode | `development` |

### Production Setup
```bash
# Generate secure JWT secret
export JWT_SECRET=$(openssl rand -hex 32)

# Or create .env file
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
```

---

## 🏗️ Deployment

### Docker Production
```bash
# Build production image
docker compose build

# Run in detached mode
docker compose up -d

# View logs
docker compose logs -f mediqueueai

# Stop services
docker compose down
```

### Heroku
```bash
heroku create mediqueueai-app
heroku stack:set container
git push heroku main
```

### Railway / Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

---

## 🧪 Testing

```bash
# Backend tests
cd backend && bun test

# Frontend tests
cd frontend && bun test

# ML model tests
cd ml && python scripts/test_model.py
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, React Router 6 |
| **Backend** | Express.js, TypeScript, Socket.io |
| **Database** | SQLite (portable, no setup) |
| **ML** | Python, scikit-learn, Random Forest |
| **Runtime** | Bun (or Node.js) |
| **Container** | Docker, Docker Compose |

---

## 📊 ML Features

MediQueueAI uses machine learning to predict wait times:

- **Model**: Random Forest & Gradient Boosting ensemble
- **Features**: Time of day, day of week, doctor specialty, queue length
- **Accuracy**: ~85% within 5-minute window
- **Retraining**: Automatic with new consultation data

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <strong>MediQueueAI</strong> - Transforming Healthcare Queue Management
  <br/>
  <sub>Built with ❤️ for better healthcare</sub>
</div>
# MediQueueAi
