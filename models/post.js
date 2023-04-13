const mongoose = require('mongoose');


const postSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });


postSchema.methods.delete = async function() {
 
  await this.deleteOne();
};


  module.exports = mongoose.model('Post', postSchema);