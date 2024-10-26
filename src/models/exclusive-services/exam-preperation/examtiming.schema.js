const mongoose = require("mongoose");;

const exam_prep_duration = new mongoose.Schema(
  {
    examname: {
      type: String,
      default: "",
      trim: true,
    },
    amount: {
      type: String,
      default: 0,
    },
    from: {
      type: String,
      default: "",
      trim: true,
    },
    to: {
      type: String,
      default: "",
      trim: true,
    },
    total_enrolled:[
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const exam_timinig = mongoose.model("exams_prep_duration", exam_prep_duration);

module.exports = exam_timinig;
