const mongoose = require("mongoose");

const ivyFormSchema = new mongoose.Schema(
    {
        // first step
        fullname: { type: String },
        gender: { type: String },
        email: { type: String },
        contact: { type: String },
        state: { type: String },
        city: { type: String },
        // second step
        class: { type: String },
        educationBoard: { type: String },
        tenthMarks: { type: String },
        eleventhMarks: { type: String },
        stream: { type: String },
        abroadStudy: { type: String },
        entranceExam: { type: String },
        dreamuniversity: { type: String },
        aboutsatexam: { type: String },
        satScore: { type: String },
        englishtest: { type: String },
        countrypreferance: { type: String },
        challengingSubject: { type: String },
        shortTermGoal: { type: String },
        longTermGoal: { type: String },
        // third step
        interestField: { type: String },
        skills: { type: String },
        BecomeInFuture: { type: String },
        activities: [
            {
                activityType: { type: String },
                workingProfile: { type: String },
                organizationName: { type: String },
                taskDescription: { type: String },
            },
        ],
        // last step
        familyincome: { type: String },
        caste: { type: String },
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
