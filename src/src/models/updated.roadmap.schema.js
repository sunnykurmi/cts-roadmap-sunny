const mongoose = require('mongoose');

const UpdatedRoadmapSchema = new mongoose.Schema({  
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    required: true,
  },
  path: {
    type: String,
    trim: true,
    default: '',
  },
  roadmapuser:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const UpdatedRoadmap = mongoose.model('UpdatedRoadmap', UpdatedRoadmapSchema);

module.exports = UpdatedRoadmap;
