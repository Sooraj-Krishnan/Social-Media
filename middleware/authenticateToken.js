const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); 

function authenticateToken(req, res, next) {
  // Get the token from the authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
 
  if (!token) {
    // If there's no token, return a 401 Unauthorized response
    return res.status(401).send({ message: 'Unauthorized' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Set the user ID in the request object for later use
    req.userId = (decoded.id);
    console.log('userID   :', userId);
    next();
  } catch (error) {
    // If the token is invalid, return a 403 Forbidden response
    return res.status(403).send({ message: 'Forbidden' });
  }
}
  

module.exports = authenticateToken;


