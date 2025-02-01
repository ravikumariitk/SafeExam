import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    allowMultipleSubmissions: {
      type: Boolean,
      default: false,
    },
    proctoring: {
      type: Boolean,
      default: false,
    },
    randomizeQuestionOrder: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    passwordProtection: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: function() {
        return this.passwordProtection;
      },
    },
    displayMode: {
      type: String,
      enum: ["all", "one-by-one"],
      required: true,
    },
    questions: {
        type: Array,
        required: true,
      },
      noOfResponses: { type: Number, required: true },
      ansKeyReleased : {type : Boolean},
      resultReleased : {type : Boolean}
  });


const answerSchema = new mongoose.Schema({
    email: { type: String, required: true },
    id: { type: String, require: true },
    roll: { type: String, required: true },
    answers: { type: Array, required: true },
    videoLink : String
});

const resultSchema = new mongoose.Schema({
    id: { type: String, require: true },
    scores: { type: Object, required: true },
});

const ansKeySchema = new mongoose.Schema({
    id: { type: String, require: true },
    answers: { type: Array, required: true },
});

const userSchema = new mongoose.Schema({
    name: { type: String, require: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    roll: { type: String, require: true },
    role: { type: String, require: true },
    token : String,
    quiz: { type: Array, require: true },
});

const optSchema = new mongoose.Schema({
  email : String,
  otp : String
})

const Quiz = mongoose.model('Quiz', quizSchema);
const Ans = mongoose.model('answers', answerSchema);
const Result = mongoose.model('result', resultSchema);
const AnsKey = mongoose.model('anskey', ansKeySchema);
const User = mongoose.model('user', userSchema);
const Otp = mongoose.model('opt', optSchema)



// Export the model
export default { Quiz, Ans, Result, AnsKey, User, Otp };
