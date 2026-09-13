<p align="center">
  <img src="logo.png" alt="UniStay Logo" width="120" />
</p>

<h1 align="center">UniStay Da Nang</h1>

<p align="center">
  <strong>A modern platform to find accommodations and roommates for students in Da Nang</strong>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61dafb?logo=react" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Prisma-336791?logo=postgresql" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css" />
</p>

---

## Introduction

**UniStay Da Nang** is a comprehensive platform designed specifically for university students in Da Nang to search for rental rooms, apartments, whole houses, and find roommates. The system connects students directly with reputable hosts, providing a smart map-based interface, real-time background processing, and AI-powered assistance to make finding a place to live safe, fast, and convenient.

### System Roles

| Role | Description |
|------|-------------|
| **Student** | Search for rooms, post roommate requests, send accommodation requests, review hosts |
| **Host** | Post rental listings, manage accommodation requests, verify properties |
| **User** | Default role before verification, can browse basic information |
| **Admin** | Manage users, moderate posts and comments, handle reports, view system feedback |

---

## Key Features

###  Map-centric Search
- Integration with **Leaflet** and **OpenStreetMap**.
- Real-time display of rental properties around universities in Da Nang.
- Filter by radius, price, area, room type, and amenities.

###  Roommate Finder
- Post detailed roommate requests with specific criteria (gender, lifestyle, budget, amenities).
- Priority matching based on demand criteria levels (LOW, MEDIUM, HIGH).

###  AI-Powered Assistant
- Integrated **Google Generative AI (Gemini)**.
- Assists in analyzing content, providing suggestions, and helping moderators with content censorship.

###  Background Processing & Real-time
- **BullMQ + Redis** for robust background job processing.
- Handles asynchronous tasks like email delivery and system notifications without blocking the main API thread.

###  Authentication & Authorization
- Secure **JWT + Bcrypt** authentication.
- Email and phone verification system.
- Comprehensive Role-Based Access Control (RBAC) across both Frontend and Backend.

###  Administration & Moderation
- Post and comment censorship workflow.
- Handle user reports (fake listings, inappropriate comments).
- Dedicated Admin dashboard for system oversight.

###  Modern UI/UX
- **Shadcn UI (Radix)** and **Tailwind CSS** for a clean, accessible interface.
- Smooth animations with **Framer Motion**.
- Multilingual support via **i18next** (English / Vietnamese).

---

## System Architecture

```text
─     
      Frontend (SPA)               Backend (REST API)   
  React 19 + Vite 6        Node.js + Express.js    
  Zustand State Mgmt            Prisma ORM              
  React Query            │       JWT Auth                
  Leaflet Maps                  Google Generative AI    
     
                                         
                               ─
                                  BullMQ + Redis         
                                  (Background Jobs)      
                               
                                         
                               
             PostgreSQL             
                                   (Primary Database)     
                                
```

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.0 | UI framework |
| Vite | 6.1 | Build tool |
| TypeScript | 5.4 | Type safety |
| Zustand | 5.0 | State management |
| TanStack Query | 5.66 | Server state caching & fetching |
| Tailwind CSS | 3.4 | Utility-first styling |
| Shadcn UI (Radix) |  | Accessible UI components |
| Leaflet | 1.9 | Interactive maps |
| i18next | 23.12 | Internationalization |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js / Express | 4.19 | REST API framework |
| TypeScript | 5.4 | Type safety |
| Prisma | 4.11 | Database ORM |
| PostgreSQL |  | Relational database |
| BullMQ | 5.73 | Message queue / Background jobs |
| Redis |  | Cache & BullMQ store |
| @google/generative-ai| 0.24 | AI Integration |
| Nodemailer | 8.0 | Email services |

---

## Project Structure

```text
 PBL3-UniStay-Da-Nang/
  backend/                         # Express.js API Server
     prisma/                      # Schema, migrations, and seed scripts
     src/
        core/                    # DB config, Middlewares, shared Utils
        modules/                 # Domain-driven feature modules
        server.ts                # Application entry point
     .env.example
     package.json
     Dockerfile                   # Backend container config

  frontend/                        # React Client Application
     src/
        components/              # Reusable UI components (Shadcn, custom)
        pages/                   # Route views
       ├ store/                   # Zustand state slices
        services/                # API fetching logic
        locales/                 # i18n translation files
     .env.example
     package.json
     Dockerfile                   # Frontend container config
     nginx.conf                   # Nginx SPA & Proxy routing

  .github/workflows/               # GitHub Actions CI/CD pipelines
  docker-compose.yml               # Local Docker orchestration (All services)
  docker-compose.prod.yml          # Production VPS orchestration (Security focused)
  Caddyfile                        # Production HTTPS & Reverse Proxy config
  logo.png                         # Project Logo
  README.md                        # Documentation
```

---

## Installation & Local Development

### Requirements
- **Node.js** (v18+)
- **Docker & Docker Compose**

### 1. Quick Start (All-in-one Docker)
You can run the entire stack (Frontend, Backend, Database, Redis, PgAdmin) using Docker Compose from the root directory:
```bash
docker-compose up -d --build
```
- **Frontend**: `http://localhost:8080`
- **Backend API**: `http://localhost:6969`
- **PgAdmin**: `http://localhost:5050`

### 2. Manual Local Development
If you prefer running Node.js and React natively for development:

**Start Dependencies (DB & Redis):**
```bash
# Temporarily start only db and redis using docker-compose
docker-compose up -d db redis
```

**Backend:**
```bash
cd backend
cp .env.example .env
npm install

# Run migrations and seed sample data
npx prisma migrate deploy
npm run seed:local

# Start development server
npm run dev
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

### 3. Production Deployment (VPS)
For deploying to a production VPS (like Oracle Cloud) with a real domain and automatic HTTPS:
1. Update `Caddyfile` with your domain.
2. Run the production orchestrator:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Test Accounts (Seeded Data)

After running `npm run seed:local`, the following test accounts are available:

- **Student**: `student.test@unistay.local` / `Test@123456`
- **Host**: `host.test@unistay.local` / `Test@123456`
- **Admin**: `admin.test@unistay.local` / `Test@123456`

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: your description"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## License

MIT License  feel free to use and modify for your own projects.
