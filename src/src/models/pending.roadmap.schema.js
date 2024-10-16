const mongoose = require('mongoose');

const pendingRoadmapSchema = new mongoose.Schema({  
  name: {
    type: String,
    trim: true,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    required: true,
  },
  contact: {
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
  roadmapcreater:{
    type:String
  },
  txtname:{
    type:String
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const PendingRoadmap = mongoose.model('Pendingroadmap', pendingRoadmapSchema);

module.exports = PendingRoadmap;
