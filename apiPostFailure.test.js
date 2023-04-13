const request = require('supertest');
const jwt = require('jsonwebtoken');
// const mongoose = require('mongoose');

const app = require('./server');
const Post = require('./models/post');
// const authenticateToken = require('./middleware/authenticateToken'); // Import the authenticateToken middleware

// Mock the authenticateToken middleware function
jest.mock('./middleware/authenticateToken', () => (req, _res, next) => {
  // Mock the decoded user ID for testing
  req.userId = '61123abc456def7890ghi123'; // Update with the desired user ID for testing
  next();
});

// Create a test for unsuccessful post creation when Title field is missing
describe('POST /api/posts with missing Title field', () => {
  it('should return a 400 status code and error message', async () => {
    // Mock the request body with missing Title field
    const requestBody = {
      description: 'This is a test post without title' // Title field is missing
    };

    // Mock the JWT token
    const token = jwt.sign({ id: '61123abc456def7890ghi123' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Use supertest to send a POST request to your endpoint
    const response = await request(app)
      .post('/api/posts')
      .send(requestBody)
      .set('authorization', `Bearer ${token}`); // Set the authorization header with the JWT token

    // Assert that the response has a 400 status code
    expect(response.status).toBe(400);

    // Assert that the response body contains the expected error message
    expect(response.body).toHaveProperty('message', 'Title field is required');

    // Check in the database if no new post is created for the user
    const postsCount = await Post.countDocuments({ createdBy: '61123abc456def7890ghi123' }); // Update with the desired user ID for testing
    expect(postsCount).toBe(0);
  });
});
