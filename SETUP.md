# Capstone Project Setup Guide

This guide will help you set up the project on a new device.

## Prerequisites
- **PHP 8.2+** and **Composer**
- **Node.js (v18+)** and **npm**
- **MySQL/MariaDB** (using Laragon is recommended on Windows)
- **Git**

---

## 1. Clone the Repository
```bash
git clone https://github.com/jcyy2520-sudo/Capstone-Finals.git
cd Capstone-Finals
```

---

## 2. Backend Setup (capstone-backend)
1. Navigate to the folder:
   ```bash
   cd capstone-backend
   ```
2. Install dependencies:
   ```bash
   composer install
   ```
3. Create environment file:
   ```bash
   cp .env.example .env
   ```
4. Generate application key:
   ```bash
   php artisan key:generate
   ```
5. Configure Database:
   - Open `.env` and set your `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`.
6. Run migrations and seeders:
   ```bash
   php artisan migrate --seed
   ```
7. Start the backend server:
   ```bash
   php artisan serve
   ```

---

## 3. Frontend Setup (capstone-frontend)
1. Navigate to the folder:
   ```bash
   cd ../capstone-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create environment file:
   - Create a `.env` file (if not present) and set the backend API URL:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```

---

## 4. Blockchain Bridge Setup (capstone-bridge)
1. Navigate to the folder:
   ```bash
   cd ../capstone-bridge
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Run a local node if testing:
   ```bash
   npx hardhat node
   ```

---

## Important Note on Secrets
The `.env` files are **not** pushed to GitHub for security. You must manually copy or recreate them on your new device using the instructions above.
