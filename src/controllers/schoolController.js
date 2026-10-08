const db = require('../config/database');

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

// Add a new school
exports.addSchool = async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Invalid or missing name' });
    }
    if (!address || typeof address !== 'string' || address.trim() === '') {
      return res.status(400).json({ error: 'Invalid or missing address' });
    }
    if (latitude === undefined || typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Invalid or missing latitude (must be between -90 and 90)' });
    }
    if (longitude === undefined || typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid or missing longitude (must be between -180 and 180)' });
    }

    // Insert into database
    const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(query, [name.trim(), address.trim(), latitude, longitude]);

    return res.status(201).json({
      message: 'School added successfully',
      schoolId: result.insertId
    });
  } catch (error) {
    console.error('Error adding school:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message, code: error.code });
  }
};

// List schools sorted by proximity
exports.listSchools = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    // Validation for query parameters
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required query parameters' });
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    if (isNaN(userLat) || userLat < -90 || userLat > 90) {
      return res.status(400).json({ error: 'Invalid latitude (must be a number between -90 and 90)' });
    }
    if (isNaN(userLon) || userLon < -180 || userLon > 180) {
      return res.status(400).json({ error: 'Invalid longitude (must be a number between -180 and 180)' });
    }

    // Fetch all schools from the database
    const query = 'SELECT * FROM schools';
    const [schools] = await db.query(query);

    // Calculate distance and sort
    const sortedSchools = schools.map(school => {
      const distance = calculateDistance(userLat, userLon, school.latitude, school.longitude);
      return { ...school, distance };
    }).sort((a, b) => a.distance - b.distance);

    return res.status(200).json({
      message: 'Schools retrieved successfully',
      count: sortedSchools.length,
      data: sortedSchools
    });
  } catch (error) {
    console.error('Error listing schools:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message, code: error.code });
  }
};
