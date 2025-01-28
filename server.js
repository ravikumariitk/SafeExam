import express from 'express';
const app = express();
import http from 'http';
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
const server = http.createServer(app);
const io = new Server(server);
import models from './models.js';
const { Quiz, Ans, Result, AnsKey, User } = models;
import mongoose from 'mongoose'
import multer from 'multer';
import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv'
dotenv.config()
app.use(express.static('build'));
import cors  from 'cors';
app.use(cors());
app.use(cors({
  origin: 'http://localhost:5173'
}));
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
  }
};
connectToMongoDB();


io.on('connection', (socket) => {

  console.log('socket connected', socket.id);
  socket.on('publish', async ({
    id,
    questions,
    displayMode,
    email,
    title,
    instructions,
    startTime,
    endTime,
    allowMultipleSubmissions,
    proctoring,
    randomizeQuestionOrder,
    shuffleOptions,
    passwordProtection,
    password }) => {
    try {
      console.log(email)
      const user = await User.findOne({ email: email });
      if (user) {
        if (!Array.isArray(user.quiz)) {
          user.quiz = [];
        }
        user.quiz.push(id);
        user.save();
        const quizData = new Quiz({
          id: id,
          title: title,
          instructions: instructions,
          startTime: startTime,
          endTime: endTime,
          allowMultipleSubmissions: allowMultipleSubmissions,
          proctoring: proctoring,
          randomizeQuestionOrder: randomizeQuestionOrder,
          shuffleOptions: shuffleOptions,
          passwordProtection: passwordProtection,
          password: password,
          displayMode: displayMode,
          questions: questions,
          noOfResponses: 0,
          ansKeyReleased : false,
          resultReleased : false
        });
        await quizData.save();
        socket.emit('publish-success', {
          id: id,
        });
      } else {
        console.error('User not found');
        socket.emit('publish-failed', {
          error: 'User not found',
        });
      }
    } catch (error) {
      console.error('Error during publish:', error);
      socket.emit('publish-failed', {
        error: 'An error occurred while publishing the quiz',
      });
    }
  });

  socket.on('sign-up', async (data) => {
    const oldUser = await User.find({ email: data.email, roll: data.roll })
    console.log(oldUser)
    if (oldUser.length) {
      socket.emit('sign-up-failed', {
        err: "User Exists!"
      });
    } else {
      const token = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
          data: {
            email: data.email,
            password: data.password
          }
        },
        process.env.JWT_SECRET
      );
      data['token'] = token;
      const signUpData = new User(data);
      signUpData.save().then(() => {
        socket.emit('sign-up-success', {
          token
        });
      }).catch((err) => {
        socket.emit('sign-up-failed', {
          err: "Something went wrong!"
        });
      })
    }
  })

  socket.on('sign-in', async (data) => {
    const oldUser = await User.find({ email: data.email, password: data.password })
    console.log(oldUser)
    if (!oldUser.length) {
      socket.emit('sign-in-failed', {
        err: "Incorrect Email or Password"
      });
    } else {
      const token = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
          data: {
            email: data.email,
            password: data.password
          }
        },
        process.env.JWT_SECRET
      );
      await User.updateOne({ email: data.email }, { $set: { token: token } });
      socket.emit('sign-in-success', {
        token
      });
    }
  })

  socket.on('get-quiz', async ({ id, email }) => {
    const response = await Quiz.findOne({ id: id })
    if(!response){
      socket.emit('get-quiz-failed')
      return
    }
    console.log(response);
    const user = await User.findOne({ email: email })
    console.log(user);

    if (!response.allowMultipleSubmissions && user && user.quiz.includes(id)) {
      socket.emit('get-quiz-completed')
    }
    else socket.emit('get-quiz-response', response)
  })

  socket.on('submit-answers', async ({ id, Answers, email, roll }) => {
    console.log(email)
    console.log(roll)
    const updatedAnswers = Answers.map((question) => ({
      ...question,
      score: question.score || 0,
      status: question.status || 'pending',
    }));
    console.log('Answers received:', Answers);
    try {
      const quiz = await Ans.findOne({ id: id, email: email });
      console.log("Quiz", quiz)
      if (quiz) {
        await Ans.updateOne({ id: id, email: email }, { $set: { answers: updatedAnswers } })
        socket.emit('submit-answers-success');
      } else {
        const newAns = new Ans({ id: id, email: email, answers: updatedAnswers, roll: roll, videoLink: "" });
        await newAns.save();
        await Quiz.updateOne({ id: id }, { $inc: { noOfResponses: 1 }});
        const user = await User.findOne({ email: email });
        if (user) {
          if (!Array.isArray(user.quiz)) {
            user.quiz = [];
          }

          if (!user.quiz.includes(id)) {
            user.quiz.push(id);
          }
          user.markModified('quiz');
          await user.save();
          socket.emit('submit-answers-success');
        } else {
          console.error('User not found');
          socket.emit('submit-answers-failed', { error: 'User not found' });
        }
      }
    } catch (err) {
      console.error('Error during submit-answers:', err);
      socket.emit('submit-answers-failed', { error: 'An error occurred' });
    }
  });

  socket.on('ans-key', async ({ id, answers }) => {
    console.log({ id, answers })
    const oldNasKey = await AnsKey.findOne({ id: id });
    if (oldNasKey) {
      await Ans.updateOne({ id: id }, { $set: { answers: answers } })
    } else {
      const ansKey = new AnsKey({
        id: id,
        answers: answers
      })
      await Quiz.updateOne({ id: id }, { $set: { ansKeyReleased: true } });
      ansKey.markModified('ansKeyReleased');
      await ansKey.save().then(() => {
      socket.emit('ans-key-success');
      }).catch((err) => {
        console.log(err)
      });
    }
  })

  socket.on('get-user-data', async ({ email }) => {
    email = email
    console.log(email);
    const data = await User.find({ email: email })
    console.log(data)
    if (data.length) {
      socket.emit('get-user-data-response', { data })
    } else {
      socket.emit('get-user-data-failed')
    }
  })

  socket.on('getAnsKey', async (id) => {
    const ansKey = await AnsKey.findOne({ id: id })
    console.log(ansKey);
    const questions = await Quiz.findOne({ id: id });
    if (ansKey) socket.emit('getAnsKey-response', { ansKey, questions })
    else socket.emit('getAnsKey-failed')
  })

  socket.on('release-result', async ({ id }) => {
    try {
      const ansKey = await AnsKey.findOne({ id: id });
      const responses = await Ans.find({ id: id });
      const quiz = await Quiz.findOne({ id: id });
      console.log("Quiz", quiz);
      console.log("AnsKey", ansKey);
      console.log("Responses:", responses);
      if (!ansKey || !quiz || !responses) {
        console.log("Data not found for the given ID");
        return;
      }
      await Quiz.updateOne({ id: id }, { $set: { resultReleased: true } });
      const questions = quiz.questions;
      let scores = {};
      for (const response of responses) {
        let score = 0;
        response.answers = response.answers.map((answerObj, questionIndex) => {
          const sanitizedAnswer = {};
          Object.keys(answerObj).forEach((key) => {
            if (key !== 'status' && key !== 'marks' && key !== 'score') {
              sanitizedAnswer[key] = answerObj[key];
            }
          });

          const userAnswer = Object.values(sanitizedAnswer);
          const question = questions[questionIndex];
          const correctAnswer = ansKey.answers[questionIndex];
          let status = 'pending';
          let marks = 0;
          console.log('User Answer:', userAnswer, 'Correct Answer:', correctAnswer);
          if (question.type === 'multiple-choice') {
            if (userAnswer.sort().join() === correctAnswer.sort().join()) {
              status = 'correct';
              marks = Number(question.correctMarks);
            } else {
              status = 'incorrect';
              marks = Number(question.incorrectMarks);
            }
          }
          else if (question.type === 'single-choice') {
            if (userAnswer[0] === correctAnswer[0]) {
              status = 'correct';
              marks = Number(question.correctMarks);
            } else {
              marks = Number(question.incorrectMarks);
            }
          }
          else if (question.type === 'subjective') {
            // Manual evaluation logic
          }
          score += marks;
          return {
            ...sanitizedAnswer,
            status: status,
            marks: marks,
          };
        });

        try {
          await response.save();
        } catch (error) {
          console.error('Error saving response for roll:', response.roll, error);
        }
        scores[response.roll] = score;
      }
      console.log(scores);
      const oldResult = await Result.findOne({ id: id })
      if (oldResult) {
        oldResult.scores = scores;
        await oldResult.save();
      }
      else {
        const scoreData = new Result({
          id: id,
          scores: scores,
        });
        await scoreData.save();
        socket.emit('release-result-success');
      }
    } catch (error) {
      socket.emit('release-result-failed')
      console.error("Error releasing results:", error);
    }
  });

  socket.on('partial-correct', async ({ id, roll, questionNo }) => {
    try {
      console.log("Partial Correct request");
      const quiz = await Quiz.findOne({ id: id });
      const response = await Ans.findOne({ id: id, roll: roll });
      if (!quiz || !response) {
        console.error("Quiz or Response not found");
        return;
      }
      if (!quiz.questions[questionNo] || !response.answers[questionNo]) {
        console.error("Invalid question number or answer");
        return;
      }

      const question = quiz.questions[questionNo];
      const answer = response.answers[questionNo];
      if (answer.status === "partial") {
        console.log("Answer is already marked as partial");
        return;
      }
      console.log(question.correctMarks)
      console.log(question.incorrectMarks)
      console.log(question.partialMarks)
      const correctMarks = Number(question.correctMarks);
      const incorrectMarks = Number(question.incorrectMarks);
      const partialMarks = Number(question.partialMarks);
      const oldScore = Number(answer.marks);
      let newScore = 0;
      if (answer.status === "correct") {
        newScore = oldScore - correctMarks + partialMarks;
      } else if (answer.status === "incorrect") {
        newScore = oldScore - incorrectMarks + partialMarks;
      }
      else{
        newScore = partialMarks;
      }
      answer.status = 'partial';
      answer.marks = newScore;
      response.markModified('answers');
      console.log("Updated Response:", response);
      await response.save();
      const ClassScore = await Result.findOne({ id: id });
      if (!ClassScore) {
        console.error("ClassScore not found");
        return;
      }

      ClassScore.scores[roll] = ClassScore.scores[roll] + (newScore - oldScore);
      ClassScore.markModified('scores');
      console.log("Updated ClassScore:", ClassScore);
      await ClassScore.save();
      socket.emit('partial-correct-success');
    } catch (error) {
      socket.emit('partial-correct-failed');
      console.error("Error in partial-correct handler:", error);
    }
  });

  socket.on('correct', async ({ id, roll, questionNo }) => {
    try {
      console.log("Correct request");
      const quiz = await Quiz.findOne({ id: id });
      const response = await Ans.findOne({ id: id, roll: roll });
      if (!quiz || !response) {
        console.error("Quiz or Response not found");
        return;
      }
      if (!quiz.questions[questionNo] || !response.answers[questionNo]) {
        console.error("Invalid question number or answer");
        return;
      }
      const question = quiz.questions[questionNo];
      const answer = response.answers[questionNo];
      if (answer.status === "correct") {
        console.log("Answer is already marked as correct");
        return;
      }
      const correctMarks = Number(question.correctMarks || 0);
      const incorrectMarks = Number(question.incorrectMarks || 0);
      const partialMarks = Number(question.partialMarks || 0);
      const oldScore = Number(answer.marks|| 0);
      let newScore = 0;

      if (answer.status === "partial") {
        newScore = oldScore - partialMarks + correctMarks;
      } else if (answer.status === "incorrect") {
        newScore = oldScore - incorrectMarks + correctMarks;
      }
      else{
        newScore = correctMarks;
      }
      answer.status = 'correct';
      answer.marks = newScore;
      response.markModified('answers');
      console.log("Updated Response:", response);
      await response.save();
      const ClassScore = await Result.findOne({ id: id });
      if (!ClassScore) {
        console.error("ClassScore not found");
        return;
      }
      ClassScore.scores[roll] = ClassScore.scores[roll] + (newScore - oldScore);
      ClassScore.markModified('scores');
      console.log("Updated ClassScore:", ClassScore);
      await ClassScore.save();
      socket.emit('correct-success');
    } catch (error) {
      socket.emit('correct-failed');
      console.error("Error in partial-correct handler:", error);
    }
  });

  socket.on('incorrect', async ({ id, roll, questionNo }) => {
    try {
      console.log("Iorrect request");
      const quiz = await Quiz.findOne({ id: id });
      const response = await Ans.findOne({ id: id, roll: roll });
      if (!quiz || !response) {
        console.error("Quiz or Response not found");
        return;
      }
      if (!quiz.questions[questionNo] || !response.answers[questionNo]) {
        console.error("Invalid question number or answer");
        return;
      }

      const question = quiz.questions[questionNo];
      const answer = response.answers[questionNo];
      if (answer.status === "incorrect") {
        console.log("Answer is already marked as partial");
        return;
      }
      const correctMarks = Number(question.correctMarks || 0);
      const incorrectMarks = Number(question.incorrectMarks || 0);
      const partialMarks = Number(question.partialMarks || 0);
      const oldScore = Number(answer.marks|| 0);
      let newScore = 0;
      if (answer.status === "correct") {
        newScore = oldScore - correctMarks + incorrectMarks;
      } else if (answer.status === "partial") {
        newScore = oldScore + incorrectMarks - partialMarks;
      }
      else{
        newScore = incorrectMarks;
      }
      answer.status = 'incorrect';
      answer.marks = newScore;
      response.markModified('answers');
      console.log("Updated Response:", response);
      await response.save();
      const ClassScore = await Result.findOne({ id: id });
      if (!ClassScore) {
        console.error("ClassScore not found");
        return;
      }

      ClassScore.scores[roll] = ClassScore.scores[roll] + (newScore - oldScore);
      console.log("Updated ClassScore:", ClassScore);
      ClassScore.markModified('scores');
      await ClassScore.save();
      socket.emit('incorrect-success');
    } catch (error) {
      socket.emit('incorrect-failed');
      console.error("Error in partial-correct handler:", error);
    }
  });

  socket.on('get-personal-result', async ({ id, email }) => {
    const response = await Ans.findOne({ id: id, email: email })
    const questions = await Quiz.findOne({ id: id });
    const ansKey = await AnsKey.findOne({ id: id })
    console.log(response)
    socket.emit('get-personal-result-response', {
      response: response,
      questions: questions,
      ansKey: ansKey
    })
  })

  socket.on('get-class-result', async ({ id }) => {
    const response = await Result.findOne({ id: id })
    console.log(response)
    socket.emit('get-class-result-response', {
      marks: (response.scores)
    })
  })

  socket.on('get-response', async ({ id }) => {
    const ansResponses = await Ans.find({ id: id });
    const questions = await Quiz.find({ id: id });
    console.log(ansResponses)
    socket.emit('get-response-result', {
      question: questions[0].questions,
      answers: ansResponses
    })
  })

  socket.on('get-quiz-data', async ({ quiz }) => {
  await Quiz.find({ id: { $in: quiz } })
  .then(data => {
    console.log('Quizzes found:', data);
    socket.emit('get-quiz-data-response', {data})
  })
  .catch(err => {
    socket.emit('get-quiz-data-failed');
  });
  })

  socket.on('edit-quiz', async ({ quiz }) => {
    try {
      const quizId = quiz.id;
      const result = await Quiz.updateOne(
        { id: quizId },
        { $set: quiz }
      );
  
      if (result.matchedCount > 0) {
        socket.emit('edit-quiz-success'); // Emit success if the quiz was updated
      } else {
        socket.emit('edit-quiz-failed', { message: 'Quiz not found' }); // Handle case when no quiz is matched
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      socket.emit('edit-quiz-failed', { message: 'Internal server error' }); // Emit failure on error
    }
  });
  
  socket.on('get-answer-data', async ({ email, ids }) => {
    const answers = await Ans.find({ email: email, id: { $in: ids } });
    console.log(answers)
    socket.emit('get-answer-data-response', { data: answers });
  })

});

const upload = multer({ dest: 'uploads/' });
const SCOPE = ['https://www.googleapis.com/auth/drive'];

async function authorize() {
  const jwtClient = new google.auth.JWT(
    process.env.CLIENTEMAIL,
    null,
    process.env.PRIVATEKEY.split(String.raw`\n`).join('\n'),
    SCOPE
  );
  await jwtClient.authorize();
  return jwtClient;
}

async function uploadFile(authClient, filePath, mimeType, fileName) {
  return new Promise((resolve, reject) => {
    const drive = google.drive({ version: 'v3', auth: authClient });

    const fileMetaData = {
      name: fileName,
      parents: [process.env.FOLDER]
    };

    drive.files.create({
      resource: fileMetaData,
      media: {
        body: fs.createReadStream(filePath),
        mimeType: mimeType
      },
      fields: 'id',
    }, function (error, file) {
      if (error) {
        return reject(error);
      }
      resolve(file);
    });
  });
}

app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    const authClient = await authorize();
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const fileName = new Date().getTime();
    const email = req.body.email;
    const id = req.body.id;
    console.log(req.file)

    const file = await uploadFile(authClient, filePath, mimeType, fileName);
    fs.unlinkSync(filePath);
    console.log(`File uploaded successfully with ID: ${file.data.id}`)
    const ans = await Ans.updateOne(
      { id: id, email: email },
      { $set: { videoLink: `https://drive.google.com/file/d/${file.data.id}/view` } }
    );
    return res.status(200).send(`File uploaded successfully with ID: ${file.data.id}`);
  } catch (error) {
    console.error('Error uploading video:', error);
    return res.status(500).send('Error uploading video');
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));