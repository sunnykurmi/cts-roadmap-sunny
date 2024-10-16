const fs = require('fs');
const path = require('path');
const OpenAI = require('openai')

const client = new OpenAI({
    apiKey: process.env.MYSECRET, // This is the default and can be omitted
});

// Read the content of the text file
const roadmapdata = path.join(__dirname,'../','public',"file","Extracurriculars for High School Students.txt");
const roadmapsample = path.join(__dirname,'../','public',"file","sample roadmap.txt");
// console.log(roadmapdata,roadmapsample);
const roadmap_data = fs.readFileSync(roadmapdata, 'utf-8');
const roadmap_sample = fs.readFileSync(roadmapsample, 'utf-8');
// console.log(fileContent);

exports.getChatCompletion =async(prompt)=> {
    let data = await client.chat.completions.create({
    messages: [
      {
        role: "user",
        content:roadmap_data,
      },
      {
        role: "user",
        content:roadmap_sample,
      },
      { role: "user", content:`${prompt}  We have to create a systematic roadmap for high school students who want to do something big in their lives but don't know where to start or what to do. So we have to create a monthly roadmap where we will suggest the best possible things he can do according to their data; it will be the academic year, so just make it from current date, according to his educational board and their common exam dates. First, give him all possible suggestions. Note and disclaimer: After that, start from this current month, add competition programs according to the dates, and use the extracurricular list file I gave roadmap_data  txt file. Where we added tons of programs, so according to that file, add things deadline-wise like their preparation, registration instructions like register for this heckathon before this deadline, start preparation, try to add all possible programs from the list according to the roadmap_sample txt file, and remember if he wants to study abroad and make sure to add deadlines correctly, like suggest taking the SAT in October, create a common app account, start essay writing, get a transcript from the school, ask teachers for the LORs, submit the application before Nov. 1, in a few universities decide where to apply in ED, then in Nov work on improving the profile and apply in Regular Decision before Jan 1. Also maintain the timeline of school exams and all; add links to possible programs according to the profiles, interests, and goals; try to make a detailed timeline roadmap; add everything that can boost his journey and make him successful; and also maintain the timeline or preparation mentions, like he is preparing for the SAT for October, so also review and add that continue SAT preparation. Try to balance everything. and also add program opportunities according to students financial condition. Please generate a systematic professional roadmap, which will help them. This roadmap has to become the world's best roadmap and remember dont repeat these mistake and errors - You just added one extracurricular in one month. Please add as much as possible according to the profile and give more than one instruction for every week he has 30 days, so make sure and give him more tasks and cover more things. And there are many errors, like you added YYGs in the January month but the deadline is in November or January 10, and there are also many other errors. Also, please start from the current month, which is August, and exams will be ending in April, and results of board exams will be available in May. You can end if the student doesn't want to study abroad, but if he is selected, then continue and talk about committing to selected universities to submit the admission deposit, get I-20 documents, give the visa interviews, book the flight tickets, decide the dorm and meal plan, and other tons of processes. Make a perfect timeline and end this roadmap in August. Please analyze and solve them and create the best roadmap. Do an intense process and create the best possible roadmap without errors `},
  {
      role: "user",
      content:`You just added one extracurricular in one month. Please add as much as possible according to the profile and give more than one instruction for every week he has 30 days, so make sure and give him more tasks and cover more things. And there are many errors, like you added YYGs in the January month but the deadline is in November or January 10, and there are also many other errors. Also, please start from the current month, which is August, and exams will be ending in April, and results of board exams will be available in May. You can end if the student doesn't want to study abroad, but if he is selected, then continue and talk about committing to selected universities to submit the admission deposit, get I-20 documents, give the visa interviews, book the flight tickets, decide the dorm and meal plan, and other tons of processes. Make a perfect timeline and end this roadmap in August. Please analyze and solve them and create the best roadmap. Do an intense process and create the best possible roadmap without errors.`,
    }
    ],
    model: "gpt-4o-mini",
  });
  // return chatCompletion.choices[0].message.content;
  // console.log(data.choices[0].message.content)
  return data.choices[0].message.content
}