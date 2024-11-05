const { catchAsyncErrors } = require("../middlewares/catchAsyncErrors");
const { getChatCompletion } = require("../utils/openai");
const User = require("../models/user.schema.js");
const PendingRoadmap = require("../models/pending.roadmap.schema.js");
const { sendmail } = require('../utils/sendmail.js');
const { txtCreater } = require('../utils/txt.creater.js');
let fs = require('fs');

exports.getroadmap = catchAsyncErrors(async (req, res, next) => {

  try {
  let student = await User.findById(req.id);
  
  let formdata = req.body;

  let prompt = `
    ***********
    personal Details:

    Full Name: ${formdata.fullname}
    Gender: ${formdata.gender}
    state: ${formdata.state}
    City: ${formdata.city}
    Date of Birth: ${formdata.dateofbirth}

     ***********
    
    my Academics:      

    Class: ${formdata.class}

    Educational board: ${formdata.educationBoard}

    10th marks: ${formdata.tenthMarks}

    11th Marks: ${formdata.eleventhMarks}

    Stream: ${formdata.stream}

    Do you want to study abroad? - ${formdata.abroadStudy}

    What About SAT Exam? - ${formdata.aboutsatexam}

    SAT Score- ${formdata.satScore}

    Which english Proficiency test - ${formdata.englishtest}

    Country Preferance - ${formdata.countrypreferance}

    Dream University Name - ${formdata.dreamuniversity}

    Are you preparing for any entrance examination? - ${formdata.entranceExam}

    Which is the most challenging subject for you?: ${formdata.challengingSubject}

    What is your short-term academic goal? - ${formdata.shortTermGoal}
    
    What is your long-term goal? - ${formdata.longTermGoal}
    
    ***********

    other Details:
    
    family Annual Income: ${formdata.familyincome}

    caste: ${formdata.caste}

    physical disability: ${formdata.physicaldisabilities}

     disabilities if any: ${formdata.physicaldisabilitiestype}

    What do you want to become in the future: ${formdata.BecomeInFuture}

    Interest Field Areas: ${formdata.interestField}
    
    ***********

    Activities/Extracurriculars:
    `;

    formdata.activities.slice(1).forEach((activity, index) => {
      prompt += `
      Activity ${index + 1}:  
    
      Activity: ${activity.activityType}
  
      Position / Role in the activity: ${activity.workingProfile}
      
      Organization/Company Name: ${activity.organizationName}
  
      Description: ${activity.taskDescription}
      
      `;
  });

  let roadmap = await getChatCompletion(prompt);

  // ***************

  // Create TXT of the roadmap
  let { txtpath, txtname } = await txtCreater(`${formdata.fullname}-${Date.now()}`, roadmap, formdata.fullname, prompt);

  // ***************

  // Save TXT in database and reference to user
  let pendingRoadmapData = await new PendingRoadmap({
    name: formdata.fullname,
    email: student.email,
    contact: student.contact,
    path: txtpath,
    roadmapuser: student._id,
    roadmapcreater: formdata?.fullname,
    txtname: txtname
  });

  student?.PendingRoadmaps?.push(pendingRoadmapData._id);
  await pendingRoadmapData.save();
  await student.save();

  res.status(200).json({
    success: true,
    message: 'Roadmap has been generated and saved as TXT. Check your mail for the roadmap.',
    student: student.fullname
  })
} catch (error) {
  console.error("Error generating roadmap:", error);
  res.status(500).json({
    success: false,
    message: "An error occurred while generating the roadmap.",
    error: error.message
  });
}
});