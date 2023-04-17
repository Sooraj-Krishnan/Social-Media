const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('./server'); 
const Post = require('./models/post'); 

// Mock the authenticateToken middleware function
jest.mock('./middleware/authenticateToken', () => (req, _res, next) => {
  // Mock the decoded user ID for testing
  req.userId = '61123abc456def7890ghi123'; // Update with the desired user ID for testing
  next();
});

// Create a test for successful post creation
describe('POST /api/posts', () => {
  it('should create a new post with valid data and return a 200 status code', async () => {
    // Mock the request body
    const requestBody = {
      title: 'Test Post',
      description: 'This is a test post'
    };

    // Mock the JWT token
    const token = jwt.sign({ id: '643dc793ddd194849f298aca' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Use supertest to send a POST request to your endpoint
    const response = await request(app)
      .post('/api/posts')
      .send(requestBody)
      .set('authorization', `Bearer ${token}`); // Set the authorization header with the JWT token

    // Assert that the response has a 200 status code
    expect(response.status).toBe(200);

    // Assert that the response body contains the expected fields
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('title', requestBody.title);
    expect(response.body).toHaveProperty('description', requestBody.description);
    expect(response.body).toHaveProperty('created_at');
    expect(response.body).toHaveProperty('comments', []);
    expect(response.body).toHaveProperty('likes', 0);

    // Assert that the post was saved in the database
    const post = await Post.findOne({ title: requestBody.title });
    expect(post).toBeTruthy();
    expect(post.title).toBe(requestBody.title);
    expect(post.description).toBe(requestBody.description);
    expect(post.createdBy).toBe('643dc793ddd194849f298aca'); // Update with the desired user ID for testing
  });
});
