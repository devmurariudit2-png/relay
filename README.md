# 🚀 Relay Platform

**The Ultimate Transaction Reconciliation & Financial Operations Dashboard.**

Relay is a premium, production-grade financial platform designed to automate transaction reconciliation, manage support tickets, and handle subscription-based financial workflows. Built with a focus on visual excellence, data integrity, and scalability.

---

## ✨ Key Features

- **📊 Intelligent Reconciliation**: Automate the matching of bank statements with internal ledger records using a high-performance matching algorithm.
- **🛡️ Idempotency & Stability**: Built-in idempotency middleware ensures financial operations are safe and never duplicated during network retries.
- **💳 Stripe Integration**: Seamless subscription management with multiple tiers (Free, Starter, Growth, Scale) and a self-service customer portal.
- **🎫 Support Ticketing**: A full-featured ticketing system for managing financial exceptions and user inquiries.
- **🔐 Zero-Latency Auth**: Integrated with Supabase Auth using custom JWT hooks for instantaneous permission checks.
- **📈 Real-time Analytics**: Live dashboard showing bank balances, reconciliation rates, and transaction velocity.
- **👥 Team Management**: Multi-tenant organization support with role-based access control (Admin, Member, Viewer).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **State Management**: React Hooks + React Query
- **Styling**: Vanilla CSS (Custom Premium Design System)
- **Deployment**: [Vercel](https://vercel.com/)

### Backend
- **Core**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via [Supabase](https://supabase.com/))
- **Services**: Class-based Service Pattern for clean, testable business logic.
- **Observability**: Winston Logger + Audit Trails.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Project
- Stripe Account (for payments)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/devmurariudit2-png/relay.git
   cd relay
   ```

2. **Setup Backend**:
   ```bash
   cd Relay-main
   npm install
   cp .env.example .env
   # Add your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
   npm run dev
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Add your VITE_API_URL and VITE_SUPABASE_URL
   npm run dev
   ```

---

## 🏗️ Architecture & Production Readiness

This platform is engineered for production with:
- **Database Indices**: Optimized for high-volume transaction lookups.
- **Audit Logging**: Every mutating action is tracked for compliance.
- **Security**: Hardened CORS policies, rate limiting, and Helmet.js protection.
- **Scalability**: Designed to run horizontally on serverless environments.

---

## 📜 License

Internal Proprietary / Commercial. All rights reserved.
