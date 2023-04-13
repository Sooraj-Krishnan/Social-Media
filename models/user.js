const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  followings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }]
});


module.exports = mongoose.model('User', userSchema);
  
  


