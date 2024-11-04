const mongoose = require("mongoose");

const ivyFormSchema = new mongoose.Schema(
  {
    // first step
    fullname: { type: String },
    contact: { type: String },
    gender: { type: String },
    email: { type: String },
    city: { type: String },
    // second step
    class: { type: String },
    educationBoard: { type: String },
    aboutsatexam: { type: String },
    satScore: { type: String },
    dreamuniversity: { type: String },
    englishtest: { type: String },
    // third step
    ecs: { type: String },
    howuknow: {
      type: [String],
    },
    // last step
    familyincome: { type: String },
    physicaldisabilities: { type: String },
    physicaldisabilitiestype: { type: String },

    response:{
      type: String,
      default: "pending", 
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const IVYForm = mongoose.model("IVYForm", ivyFormSchema);

module.exports = IVYForm;
