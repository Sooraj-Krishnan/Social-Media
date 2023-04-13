require('dotenv').config();
const express = require('express');
const validator = require('validator');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/authenticateToken');
// const jwt = require('jsonwebtoken');
const router = express.Router();
const app = express();

// Database connection
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Middleware
app.use(bodyParser.json());

// Models
const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');
const Like = require('./models/like');




// Authenticate user
app.post('/api/authenticate', async (req, res) => {
  const { email, password } = req.body;

  // Validate email format
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  // Skip password format validation

  try {
    // Check if user with same email already exists in the database
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If user with same email already exists, return the JWT token along with user already exists message
      const userId = existingUser._id; // Get the user ID from existing user
      const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return res.status(409).json({ message: 'User already exists', token });
    }

    // If user with same email does not exist, create a new user
    // Generate a JWT token with a hardcoded user ID or any other desired value
    const userId = 'user123'; // Example hardcoded user ID
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Save the user to the database
    const newUser = new User({ email, password });
    await newUser.save();

    // Return the JWT token
    res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});




 // Get user profile
app.get('/api/user', authenticateToken, (req, res) => {
  const userId =(req.userId);

  User.findById(userId)
    .populate('followers')
    .populate('followings')
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

        // Update followers and followings fields of user object
        user.followers = user.followers.length;
        user.followings = user.followings.length;

      res.status(200).json({
        name: user.email,
        followers: user.followers.length,
        followings: user.followings.length
      });
    })
    .catch(err => console.log(err));
});
 


// Follow user
app.post('/api/follow/:id', (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  User.findByIdAndUpdate(id, { $addToSet: { followers: userId } })
    .then(() => {
      console.log('Followers updated successfully');
      User.findByIdAndUpdate(userId, { $addToSet: { followings: id } })
        .then(() => {
          console.log('Followings updated successfully');
         res.status(200).json({ message: 'User followed successfully' });
        //return User.findById(userId).populate('followers').populate('followings');
        });
    })
    .catch(err => console.log(err));
});


// Unfollow user
app.post('/api/unfollow/:id', (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  User.findByIdAndUpdate(id, { $pull: { followers: userId } })
    .then(() => {
      User.findByIdAndUpdate(userId, { $pull: { followings: id } })
        .then(() => res.status(200).json({ message: 'User unfollowed successfully' }));
    })
    .catch(err => console.log(err));
});

// Add new post
app.post('/api/posts', authenticateToken, (req, res) => {
  const userId = req.userId;
  const { title, description } = req.body;

  const post = new Post({
    title,
    description,
    createdBy: userId,
    user: userId // Set the user field with the userId value
  });

  post.save()
    .then(result => res.status(200).json({
      id: result._id,
      title: result.title,
      description: result.description,
      created_at: result.createdAt,
      comments: [],
      likes: 0
    }))
    .catch(err => console.log(err));
});


// GET api/posts/:id
app.get('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).send('Post not found');
      }
      const likes = await Like.countDocuments({ post: post._id });
      const comments = await Comment.find({ post: post._id }).populate('user', 'username');
      res.send({ post, likes, comments });
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });
  
  // GET api/all_posts
  app.get('/api/all_posts', authenticateToken, async (req, res) => {
    try {
      const posts = await Post.find({ user: req.userId }).sort({ createdAt: -1 }).lean();
      const postIds = posts.map(post => post._id);
      const likes = await Like.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: '$post', count: { $sum: 1 } } }
      ]);
      const comments = await Comment.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: '$post', count: { $sum: 1 } } }
      ]);
      const likesMap = likes.reduce((map, like) => {
        map.set(like._id.toString(), like.count);
        return map;
      }, new Map());
      const commentsMap = comments.reduce((map, comment) => {
        map.set(comment._id.toString(), comment.count);
        return map;
      }, new Map());
      const data = posts.map(post => {
        const id = post._id.toString();
        return {
          id,
          title: post.title,
          desc: post.description,
          created_at: post.createdAt,
          comments: commentsMap.get(id) || 0,
          likes: likesMap.get(id) || 0
        };
      });
      res.send(data);
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });

  
  //POST api/like/:id

app.post('/api/like/:id', authenticateToken, async (req, res) => {
  try {
    const like = await Like.findOne({ user: req.userId, post: req.params.id });
    if (like) {
      return res.status(400).send('Post already liked');
    }
    const newLike = new Like({ user: req.userId, post: req.params.id });
    await newLike.save();
    res.send('Post liked');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

  // POST api/unlike/:id
  
  app.post('/api/unlike/:id', authenticateToken, async (req, res) => {
    try {
        const like = await Like.findOne({ user: req.userId, post: req.params.id });
        if (!like) {
            return res.status(400).send('Post not liked');
        }
        await Like.deleteOne({ _id: like._id });
        res.send('Post unliked');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

  // POST api/comment/:id
  app.post('/api/comment/:id', authenticateToken, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).send('Post not found');
      }
      const newComment = new Comment({ user: req.userId, post: req.params.id, content: req.body.content });
      await newComment.save();
      res.send({ comment_id: newComment._id });
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });

  
  // DELETE api/posts/:id
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).send('Post not found');
      }
      if (post.user.toString() !== req.userId) {
        return res.status(401).send('Unauthorized');
      }
      await post.delete();
      res.send('Post deleted');
    } catch (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    }
  });


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


  
  