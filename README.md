# Beauty Point - Luxury Cosmetics Storefront & Command Hub

Beauty Point is a premium, state-of-the-art e-commerce application styled similarly to Sephora and Nykaa, built with a React frontend, Node.js + Express backend, and a relational MySQL database. 

This repository contains everything required to run, test, and deploy the application.

---

## Technical Stack
- **Frontend:** React (v19), Tailwind CSS, Lucide icons, Motion (Framer Motion), Recharts (KPI Analytics charts)
- **Backend:** Express.js, TypeScript (`tsx` runner), Multer (Image uploads)
- **Database:** MySQL 8.0+ (using `mysql2` client) with a synchronous write-through JSON database fallback.

---

## 1. Prerequisites & Required Software
Before running the application, make sure you have the following software installed on your machine:
1. **Node.js** (v18.0 or higher is recommended)
2. **MySQL Server** (v8.0 or higher)

---

## 2. MySQL Installation & Configuration

### Windows Installation
1. Download the **MySQL Installer** from the [official download page](https://dev.mysql.com/downloads/installer/).
2. Choose **Developer Default** or **Server Only** and follow the setup wizard.
3. During setup, configure the following:
   - Port: `3306` (default)
   - Authentication Method: **Use Strong Password Encryption**
   - Choose a root password (e.g., `admin123` or your own custom password).
4. Finish installation and make sure the MySQL service (usually named `MySQL80`) is running.

---

## 3. Environment Variables Configuration
1. Open the `.env` file in the root directory.
2. Edit the database credentials to match your local MySQL configuration:
   ```env
   # Server Configurations
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=beauty_point_luxury_key_2026

   # Database Configurations
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
   DB_NAME=beauty_point
   DB_PORT=3306

   # Gemini AI API Configuration
   GEMINI_API_KEY=MY_GEMINI_API_KEY
   APP_URL=http://localhost:3000
   ```

---

## 4. How to Run the Project

### Step 1: Install Dependencies
Run the following command in the root directory of the project:
```bash
npm install
```

### Step 2: Run in Development Mode
Start the development server:
```bash
npm run dev
```
The server will boot up and:
1. Load environment variables.
2. Probe MySQL using the credentials in your `.env` (automatically scanning standard developer passwords if the default fails).
3. Connect and ensure the `beauty_point` database exists.
4. Execute `database/schema.sql` automatically if the tables are not found.
5. Populate tables with sample seed records (including the default admin user).
6. Enable a hot write-through JSON database backup at `data/database.json`.
7. Configure Vite development middleware and open port `3000`.

Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

### Step 3: Run in Production Mode
To build the application and run the production server:
```bash
npm run build
npm start
```

---

## 5. Verification & Testing

### Health Check Endpoint
To inspect the status of the server and database tables, go to:
**[http://localhost:3000/api/health](http://localhost:3000/api/health)**

Expected output when fully connected:
```json
{
  "status": "success",
  "serverRunning": true,
  "databaseConnected": true,
  "productsTableFound": true,
  "customersTableFound": true,
  "ordersTableFound": true
}
```

For a detailed verification walkthrough of all features (including CRUD, auth, and checkouts), please refer to the **[TESTING.md](TESTING.md)** guide.

---

## Default Administrator Account

