# 🏫 EduCase Pro — School Management & Geospatial Proximity Engine

[![Live Deployment](https://img.shields.io/badge/Live%20Demo-Railway%20Active-00C7B7?style=for-the-badge&logo=railway&logoColor=white)](https://educase-school-management-production.up.railway.app)
[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%20LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)

An intelligent full-stack School Management API and Geospatial Discovery Platform built with **Node.js**, **Express**, **MySQL**, and **Leaflet (OpenStreetMap)**. It enables administrators to register schools and discover institutions sorted dynamically by their real-world geographical proximity to any user location.

---

## 🌐 Live Production URL

- **Web Application & Interactive Map:**  
  👉 **[https://educase-school-management-production.up.railway.app](https://educase-school-management-production.up.railway.app)**

- **API Health Check:**  
  👉 **[https://educase-school-management-production.up.railway.app/health](https://educase-school-management-production.up.railway.app/health)**

- **Live Database Diagnostics:**  
  👉 **[https://educase-school-management-production.up.railway.app/api/status](https://educase-school-management-production.up.railway.app/api/status)**

---

## ✨ Features

- **📍 Geospatial Proximity Engine:** Calculates spherical great-circle distance in kilometers using the mathematical **Haversine Formula**.
- **🗺️ Interactive Map (Zero API Key Required):** Uses standard **OpenStreetMap** with Leaflet. No paid Google Maps API keys or third-party tokens needed. Works 100% free forever without rate-limiting.
- **⚡ Automatic Database Migration:** Auto-executes `CREATE TABLE IF NOT EXISTS schools` on server boot. No manual SQL imports required on fresh deployments.
- **🛡️ Strict Input Validation:** Enforces non-empty strings, latitude range $[-90, 90]$, and longitude range $[-180, 180]$.
- **🎨 Modern Dual-Theme UI:** Dark and Light mode themes with custom map tile shaders, radius sliders, search filters, and geodesic distance lines.
- **📊 Data Export:** One-click JSON and CSV export of all registered schools.
- **🚀 Cloud-Ready Architecture:** Seamless auto-detection of environment variables (`DATABASE_URL`, `MYSQL_URL`, `MYSQL_PUBLIC_URL`, TCP Proxies, or discrete `DB_*` hosts).

---

## 📐 Mathematical Formulation: The Haversine Formula

To calculate the direct great-circle distance between two points on the Earth's surface (user origin $(\phi_1, \lambda_1)$ and school destination $(\phi_2, \lambda_2)$):

$$\Delta\phi = \frac{(\phi_2 - \phi_1) \cdot \pi}{180}, \quad \Delta\lambda = \frac{(\lambda_2 - \lambda_1) \cdot \pi}{180}$$

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos\left(\frac{\phi_1 \cdot \pi}{180}\right) \cdot \cos\left(\frac{\phi_2 \cdot \pi}{180}\right) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$

$$d = R \cdot c \quad \text{where } R = 6371\text{ km (Earth's mean radius)}$$

---

## 📡 API Reference

### 1. Register a New School
Validates and persists a new school record to the database.

- **Endpoint:** `POST /addSchool`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "name": "Delhi Public School, R.K. Puram",
    "address": "Sector 12, RK Puram, New Delhi - 110022",
    "latitude": 28.5683,
    "longitude": 77.1717
  }
  ```
- **Validation Rules:**
  - `name`: Non-empty string (trimmed)
  - `address`: Non-empty string (trimmed)
  - `latitude`: Number between `-90.0` and `90.0`
  - `longitude`: Number between `-180.0` and `180.0`
- **Response (`201 Created`):**
  ```json
  {
    "message": "School added successfully",
    "schoolId": 1
  }
  ```
- **Error Response (`400 Bad Request`):**
  ```json
  {
    "error": "Invalid or missing latitude (must be between -90 and 90)"
  }
  ```

---

### 2. List Schools by Proximity
Retrieves all schools from the database and returns them ordered in ascending proximity (nearest first) to the user's coordinates.

- **Endpoint:** `GET /listSchools`
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `latitude` | `Float` | **Yes** | User's latitude (e.g. `28.5355`) |
  | `longitude` | `Float` | **Yes** | User's longitude (e.g. `77.3910`) |

- **Example Request:**
  ```http
  GET /listSchools?latitude=28.5355&longitude=77.3910
  ```

- **Response (`200 OK`):**
  ```json
  {
    "message": "Schools retrieved successfully",
    "count": 1,
    "data": [
      {
        "id": 1,
        "name": "Delhi Public School, R.K. Puram",
        "address": "Sector 12, RK Puram, New Delhi - 110022",
        "latitude": 28.5683,
        "longitude": 77.1717,
        "distance": 21.73
      }
    ]
  }
  ```

---

### 3. Health & Diagnostic Endpoints

- **`GET /health`**
  ```json
  {
    "status": "ok",
    "database": "connected",
    "message": "School Management API and Database are operational"
  }
  ```

- **`GET /api/status`**  
  Returns real-time connection telemetry, database table status, and active school count.

---

## 🗄️ Database Schema

The application uses a relational MySQL database table (`schools`):

```sql
CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL
);
```

> **Note:** The server executes this automatically upon connection.

---

## 💻 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or v20.x recommended)
- [MySQL](https://www.mysql.com/) server running locally (or any remote MySQL database)

### 1. Clone & Install
```bash
git clone https://github.com/VVarun97/educase-school-management.git
cd educase-school-management
npm install
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
PORT=3000

# Option A: Discrete Credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=school_management
DB_SSL=false

# Option B: Or Full Connection String
# DATABASE_URL=mysql://root:your_mysql_password@localhost:3306/school_management
```

### 3. Run the Server
```bash
# Development mode with auto-reload:
npm run dev

# Or standard production mode:
npm start
```

Open **`http://localhost:3000`** in your browser. The frontend UI will load and automatically connect to your local backend.

---

## ☁️ Deployment Guide

### Deploying to Railway (Zero-Config)
1. Fork or push this repository to your GitHub account.
2. Go to [Railway.app](https://railway.app/) and create a **New Project**.
3. Provision a **MySQL** database.
4. Enable **TCP Proxy / Public Networking** in the MySQL settings.
5. Deploy your GitHub repository as the Node.js service.
6. Under the Node.js service **Variables**, link `DATABASE_URL` (or paste the connection string).
7. Under **Settings &rarr; Networking**, click **Generate Domain**.

### Deploying with Docker
A production-ready [Dockerfile](Dockerfile) is included:
```bash
# Build Docker image
docker build -t educase-api .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/dbname" \
  educase-api
```

---

## 📁 Project Structure

```text
├── Dockerfile                   # Production container build
├── init_db.sql                  # Database schema definition
├── package.json                 # Project dependencies and run scripts
├── public/                      # Static Full-Stack Web Interface
│   ├── app.js                   # Client controller, Haversine client, & Leaflet logic
│   ├── index.html               # Main dashboard UI
│   └── styles.css               # Styling system, responsive grid, & dark mode theme
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection pool & auto-migration engine
│   ├── controllers/
│   │   └── schoolController.js  # AddSchool & ListSchools business logic
│   ├── routes/
│   │   └── schoolRoutes.js      # Express route definitions
│   └── index.js                 # Server entry point & static asset provider
└── School_Management_API.postman_collection.json  # Postman test suite
```

---

## 📮 Postman Collection

Import the included file:
```text
School_Management_API.postman_collection.json
```
Into [Postman](https://www.postman.com/) to immediately test both endpoints with preconfigured request bodies and test scripts.

---

## 📄 License

This project is licensed under the **ISC License**.
