# School Management API

This is a Node.js API built with Express.js and MySQL to manage school data. It provides functionality to add new schools and list existing schools sorted by their geographical proximity to a user-specified location.

## Prerequisites
- Node.js (v14 or higher)
- MySQL

## Setup Instructions

1. **Clone the repository and install dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Create a MySQL database (e.g., `school_management`).
   - Run the provided `init_db.sql` script to create the required `schools` table:
     ```sql
     CREATE TABLE IF NOT EXISTS schools (
         id INT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(255) NOT NULL,
         address VARCHAR(255) NOT NULL,
         latitude FLOAT NOT NULL,
         longitude FLOAT NOT NULL
     );
     ```

3. **Environment Variables**
   - Rename `.env.example` to `.env`.
   - Update the database credentials in the `.env` file according to your MySQL configuration:
     ```env
     PORT=3000
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=yourpassword
     DB_NAME=school_management
     ```

4. **Run the API and Frontend locally**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Or standard execution
   node src/index.js
   ```
   - Open your browser at **`http://localhost:3000`** to access the **EduCase Pro** Geospatial Frontend!
   - You can also directly double-click `frontend/index.html` or `educase-main/public/index.html` in any web browser to open the UI immediately in interactive Demo/Sandbox mode.

## API Documentation

### 1. Add School
- **Endpoint:** `/addSchool`
- **Method:** `POST`
- **Description:** Validates and adds a new school to the database.
- **Payload:**
  ```json
  {
    "name": "Delhi Public School",
    "address": "Sector 12, RK Puram, New Delhi",
    "latitude": 28.5683,
    "longitude": 77.1717
  }
  ```
- **Response (Success - 201):**
  ```json
  {
    "message": "School added successfully",
    "schoolId": 1
  }
  ```

### 2. List Schools
- **Endpoint:** `/listSchools`
- **Method:** `GET`
- **Description:** Fetches all schools and sorts them by proximity to the provided coordinates.
- **Parameters (Query):**
  - `latitude` (Float) - User's current latitude
  - `longitude` (Float) - User's current longitude
- **Example Request:**
  `GET /listSchools?latitude=28.5355&longitude=77.3910`
- **Response (Success - 200):**
  ```json
  {
    "message": "Schools retrieved successfully",
    "count": 1,
    "data": [
      {
        "id": 1,
        "name": "Delhi Public School",
        "address": "Sector 12, RK Puram, New Delhi",
        "latitude": 28.5683,
        "longitude": 77.1717,
        "distance": 21.65 // Distance in kilometers
      }
    ]
  }
  ```

## Hosting and Deployment

To deploy this application on services like Render, Railway, or Heroku:
1. Ensure your chosen platform provides a managed MySQL database (or use a service like Aiven/PlanetScale).
2. Set the Environment Variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`) in the hosting dashboard.
3. Configure the Start Command as `node src/index.js`.
4. The platform will automatically install dependencies and start the app.
"# educase-school-management" 
