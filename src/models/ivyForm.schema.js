const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  activityType: { type: String },
  workingProfile: { type: String },
  organizationName: { type: String },
  taskDescription: { type: String },
});

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
    tenthMarks: { type: String },
    eleventhMarks: { type: String },
    stream: { type: String },
    entranceExam: { type: String },
    aboutsatexam: { type: String },
    countrypreferance: { type: String },
    satScore: { type: String },
    dreamuniversity: { type: String },
    englishtest: { type: String },
    // third step
    interestField: { type: String },
    skills: { type: String },
    BecomeInFuture: { type: String },
    activities: [activitySchema],
    // last step
    familyincome: { type: String },
    physicaldisabilities: { type: String },
    physicaldisabilitiestype: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const IVYForm = mongoose.model("IVYForm", ivyFormSchema);

module.exports = IVYForm;
