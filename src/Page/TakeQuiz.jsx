import React, { useState, useEffect, useRef } from "react";
import { initSocket } from "../socket";
import axios from "axios";
import toast from "react-hot-toast";

function TakeQuiz({ email, roll }) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(10000000000000);
  const [noOfQuestion, setNoOfQuestion] = useState(0);
  const [displayMode, setDisplayMode] = useState("all");
  const [title, setTile] = useState("");
  const [instructions, setInstructions] = useState("");
  const [startTime, setStartTime] = useState();
  const [endTime, setEndTime] = useState();
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false);
  const [proctoring, setProctoring] = useState(false);
  const [randomizeQuestionOrder, setRandomizeQuestionOrder] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [password, setPassword] = useState("");
  const [displayInstructions, setDisplayInstructions] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [started, setStarted] = useState(false);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [originalIndices, setOriginalIndices] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [finished, setFinished] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const videoCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  const startRecording = async () => {
    try {
      const videoCanvas = videoCanvasRef.current;
      if (!videoCanvas) {
        toast.error("Canvas not initialized. Please try again.");
        return;
      }
  
      const ctx = videoCanvas.getContext("2d");
      if (!ctx) {
        toast.error("Failed to get canvas context.");
        return;
      }
  
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
  
      const screenVideo = document.createElement("video");
      screenVideo.srcObject = screenStream;
      await screenVideo.play();
  
      const cameraVideo = document.createElement("video");
      cameraVideo.srcObject = cameraStream;
      await cameraVideo.play();
  
      videoCanvas.width = screenVideo.videoWidth || 1280;
      videoCanvas.height = screenVideo.videoHeight || 720;
  
      const drawFrame = () => {
        ctx.drawImage(screenVideo, 0, 0, videoCanvas.width, videoCanvas.height);
        const cameraWidth = videoCanvas.width / 4;
        const cameraHeight = videoCanvas.height / 4;
        ctx.drawImage(
          cameraVideo,
          videoCanvas.width - cameraWidth - 10,
          videoCanvas.height - cameraHeight - 10,
          cameraWidth,
          cameraHeight
        );
        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };
  
      drawFrame();
  
      const combinedStream = videoCanvas.captureStream();
      screenStream
        .getAudioTracks()
        .forEach((track) => combinedStream.addTrack(track));
  
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm",
      });
  
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
  
      mediaRecorder.onstop = () => {
        screenStream.getTracks().forEach((track) => track.stop());
        cameraStream.getTracks().forEach((track) => track.stop());
        cancelAnimationFrame(animationFrameRef.current);
  
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        uploadVideo(blob);
      };
  
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error(
        "Error starting recording. Please ensure permissions are granted."
      );
    }
  };

  const stopRecording = () => {
    console.log("Stopping")
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const uploadVideo = async (videoBlob) => {
    try {
      const formData = new FormData();
      formData.append("video", videoBlob, "recording.mp4");
      formData.append("email", email);
      formData.append("id", id);
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
    } catch (error) {}
  };

  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));
      function handleErrors(e) {
        toast.error("Connection failed. Try again later.");
      }
    }
    init();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = () => {
    const toastId = toast.loading("Fetching Quiz Data ...");
     setTimeout(() => {
                toast.dismiss(toastId);
              }, 5000);
    socketRef.current.emit("get-quiz", { id, email });
    socketRef.current.on("get-quiz-completed", () => {
      toast.error("Quiz is Attempted, Multiple submissions are not allowed", {
        id: toastId,
      });
    });
    socketRef.current.on("get-quiz-failed", () => {
      toast.error("Quiz dont exists", { id: toastId });
    });
    socketRef.current.on("get-quiz-response", (exam) => {
      toast.success("Quiz Data Fetched!", { id: toastId });
      setTile(exam.title);
      setInstructions(exam.instructions);
      setStartTime(exam.startTime);
      setEndTime(exam.endTime);
      setAllowMultipleSubmissions(exam.allowMultipleSubmissions);
      setProctoring(exam.proctoring);
      setRandomizeQuestionOrder(exam.randomizeQuestionOrder);
      setShuffleOptions(exam.shuffleOptions);
      setPasswordProtection(exam.passwordProtection);
      setPassword(exam.password);
      setDisplayMode(exam.displayMode);
      setQuestions(exam.questions);
      setDisplayInstructions(true);
    });
  };

  useEffect(() => {
    if (questions.length > 0) {
      setNoOfQuestion(questions.length);
      setAnswers(questions.map(() => ""));
    }
  }, [questions]);

  const handleAnswerChange = (index, value, isCheckbox = false) => {
    const updatedAnswers = [...answers];
    if (isCheckbox) {
      const selectedOptions = updatedAnswers[index] || [];
      updatedAnswers[index] = selectedOptions.includes(value)
        ? selectedOptions.filter((opt) => opt !== value)
        : [...selectedOptions, value];
    } else {
      updatedAnswers[index] = value;
    }
    setAnswers(updatedAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimer(questions[currentQuestionIndex + 1]?.time || 0);
    } else {
      handleQuizSubmit();
    }
  };

  const handleQuizSubmit = () => {
    if (started) {
      let Answers = []
      if(randomizeQuestionOrder){
        Answers = originalIndices.map(
          (originalIndex) => answers[originalIndex]
        );
      }else{
        Answers = answers
      }
      console.log("Ans",Answers)
      const toastId = toast.loading("Submitting Quiz...");
       setTimeout(() => {
                  toast.dismiss(toastId);
                }, 5000);
      socketRef.current.emit("submit-answers", { id, Answers, email, roll });
      socketRef.current.on("submit-answers-success", () => {
        toast.success("Your quiz has been submitted!", { id: toastId });
        if(proctoring) {stopRecording()}
        setFinished(true);
        setStarted(false);
      });
      socketRef.current.on("submit-answers-failed", () => {
        toast.error("Something went wrong!", { id: toastId });
      });
    }
  };

  useEffect(() => {
    console.log(finished);
  }, [finished]);

  const startQuiz = () => {
    if (
      (passwordProtection && password == enteredPassword) ||
      !passwordProtection
    ) {
      setDisplayInstructions(false);
      if (displayMode === "all") {
        const totalTime = questions.reduce((sum, q) => sum + Number(q.time), 0);
        setTimer(totalTime);
      } else {
        setTimer(questions[0]?.time || 0);
      }
      if(proctoring) startRecording();
      setStarted(true);
      if (randomizeQuestionOrder) {
        const originalIndices = questions.map((_, index) => index);
        setOriginalIndices(originalIndices);
        const shuffledQuestions = [...questions];
        shuffledQuestions.sort(() => Math.random() - 0.5);
        setQuestions(shuffledQuestions);
      }
      if (shuffleOptions) {
        const shuffledOptions = questions.map((q, index) => {
          const shuffledOptions = q.options.sort(() => Math.random() - 0.5);
          return { ...q, options: shuffledOptions };
        });
        setQuestions(shuffledOptions);
      }
    } else {
      toast.error("Wrong Password !!!");
    }
  };

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      if (
        displayMode === "one-by-one" &&
        currentQuestionIndex < questions.length - 1
      ) {
        handleNextQuestion();
      } else {
        handleQuizSubmit();
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timer]);

  function getTimeValue() {
    const curr = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "Invalid date/time input.";
    }

    if (curr > start && curr < end) {
      return "Start Quiz";
    } else if (curr > end) {
      return "Quiz Closed";
    } else {
      const diffInMs = Math.abs(start.getTime() - curr.getTime());
      const diffInSeconds = Math.floor((diffInMs / 1000) % 60);
      const diffInMinutes = Math.floor((diffInMs / (1000 * 60)) % 60);
      const diffInHours = Math.floor((diffInMs / (1000 * 60 * 60)) % 24);
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      return `Starting in: ${diffInDays} days, ${diffInHours} hours, ${diffInMinutes} minutes, ${diffInSeconds} seconds.`;
    }
  }

  const handleOptionStyles = (index, value, answers, isCheckbox) => {
    if (isCheckbox) {
      return answers[index]?.includes(value)
        ? styles.optionSelected
        : styles.option;
    }
    return answers[index] === value ? styles.optionSelected : styles.option;
  };

  return (
    <>
    <canvas ref={videoCanvasRef} style={{ display: "none" }}></canvas>
      <div style={{ display: "none" }}>{started}</div>
      <div style={styles.container}>
        <h2 styles={styles.heading}>Take Quiz</h2>
        <br />
        {!displayInstructions && !started && (
          <>
            <input
              style={styles.input}
              type="text"
              placeholder="Enter quiz ID"
              onChange={(e) => setId(e.target.value)}
            />{" "}
            &nbsp; &nbsp;
            <input
              style={styles.button}
              type="submit"
              value="Start Quiz"
              onClick={handleSubmit}
            />
          </>
        )}
        {displayInstructions && !started && (
          <>
            <h3 style={styles.innerContainer}>{title}</h3>
            <div style={styles.innerContainer}>
              <h4>Instructions </h4>
              <br />
              {instructions}{" "}
            </div>
            {passwordProtection && (
              <div style={styles.innerContainer}>
                This is en password protected quiz enter password to procced
                :&nbsp;
                <input
                  type="text"
                  style={{
                    padding: "8px",
                    fontSize: "14px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    width: "auto",
                  }}
                  placeholder="Enter Password"
                  onChange={(e) => {
                    setEnteredPassword(e.target.value);
                  }}
                />
              </div>
            )}
            {proctoring && (
              <div>
                <p>
                  This is a Proctored exam please enable your screen and camera
                  recording
                </p>{" "}
                <br />
                <canvas
                  ref={videoCanvasRef}
                  style={{ display: "none" }}
                ></canvas>
              </div>
            )}

            {getTimeValue() === "Start Quiz" && (
              <button
                style={styles.button}
                onClick={startQuiz}
                // disabled={proctoring && !isRecording}
              >
                Start Quiz
              </button>
            )}
          </>
        )}
        {getTimeValue() !== "Start Quiz" && <>{getTimeValue()}</>}
        {started && timer > 0 && <h3>Time Remaining: {timer}s</h3>}

        {started && displayMode === "all" && questions.length > 0 && (
          <div>
            <h2>{title}</h2>
            {questions.map((question, index) => (
              <div key={index} style={styles.question}>
                <div style={styles.marks}>
                  <span style={styles.correct}>
                    +{question.correctMarks || 0} /{" "}
                  </span>
                  <span style={styles.incorrect}>
                    {question.incorrectMarks || 0} /{" "}
                  </span>
                  <span style={styles.partial}>
                    +{question.partialMarks || 0}
                  </span>
                </div>
                <p>
                  Q{index + 1}: {question.statement}
                </p>
                {question.type === "multiple-choice" && (
                  <div style={styles.optionsContainer}>
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        style={handleOptionStyles(index, option, answers, true)}
                        onClick={() => handleAnswerChange(index, option, true)}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
                {question.type === "subjective" && (
                  <textarea
                    style={styles.textarea}
                    value={answers[index] || ""}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder="Enter your answer"
                  />
                )}
              </div>
            ))}
            <button style={styles.button} onClick={handleQuizSubmit}>
              Submit Answers
            </button>
          </div>
        )}

        {started && displayMode === "one-by-one" && questions.length > 0 && (
          <div>
            <h2>Quiz: {title}</h2>
            <div style={styles.question}>
              <div style={styles.marks}>
                <span style={styles.correct}>
                  +{questions[currentQuestionIndex]?.correctMarks || 0} /
                </span>
                <span style={styles.incorrect}>
                  {questions[currentQuestionIndex]?.incorrectMarks || 0} /
                </span>
                <span style={styles.partial}>
                  +{questions[currentQuestionIndex]?.partialMarks || 0}
                </span>
              </div>
              <p>
                Q{currentQuestionIndex + 1}:{" "}
                {questions[currentQuestionIndex]?.statement}
              </p>
              {questions[currentQuestionIndex]?.type === "multiple-choice" && (
                <div style={styles.optionsContainer}>
                  {questions[currentQuestionIndex]?.options.map(
                    (option, optIndex) => (
                      <div
                        key={optIndex}
                        style={handleOptionStyles(
                          currentQuestionIndex,
                          option,
                          answers,
                          true
                        )}
                        onClick={() =>
                          handleAnswerChange(currentQuestionIndex, option, true)
                        }
                      >
                        {option}
                      </div>
                    )
                  )}
                </div>
              )}
              {questions[currentQuestionIndex]?.type === "single-choice" && (
                <div style={styles.optionsContainer}>
                  {questions[currentQuestionIndex]?.options.map(
                    (option, optIndex) => (
                      <div
                        key={optIndex}
                        style={handleOptionStyles(
                          currentQuestionIndex,
                          option,
                          answers,
                          false
                        )}
                        onClick={() =>
                          handleAnswerChange(currentQuestionIndex, option)
                        }
                      >
                        {option}
                      </div>
                    )
                  )}
                </div>
              )}
              {questions[currentQuestionIndex]?.type === "subjective" && (
                <textarea
                  style={styles.textarea}
                  value={answers[currentQuestionIndex] || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestionIndex, e.target.value)
                  }
                  placeholder="Enter your answer"
                />
              )}
            </div>
            <div style={styles.navigationButtons}>
              <button
                style={styles.button}
                onClick={() => {
                  setCurrentQuestionIndex((prev) =>
                    Math.min(prev + 1, questions.length)
                  );
                  handleNextQuestion();
                }}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
              </button>{" "}
              &nbsp; &nbsp;
              {currentQuestionIndex === questions.length - 1 && (
                <button style={styles.button} onClick={handleQuizSubmit}>
                  Submit Answers
                </button>
              )}
            </div>
          </div>
        )}

        {/* </div> */}
      </div>
    </>
  );
}

const styles = {
  container: {
    width: "100%",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
  },
  question: {
    marginBottom: "20px",
    backgroundColor: "#fff",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    position: "relative",
  },
  marks: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "white",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    padding: "5px 10px",
    borderRadius: "20px",
  },
  innerContainer: {
    width: "100%",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
  },

  heading: {
    // textAlign: 'center',
    color: "#333",
  },
  input: {
    padding: "8px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    width: "60%",
  },
  correct: {
    color: "green",
  },
  incorrect: {
    color: "red",
  },
  partial: {
    color: "orange",
  },
  optionsContainer: {
    marginTop: "10px",
    display: "flex",
    flexDirection: "column", // Stack options vertically
    gap: "10px",
  },
  option: {
    padding: "10px",
    // textAlign: 'center',
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s ease, color 0.3s ease",
    backgroundColor: "#ffffc5",
  },
  optionSelected: {
    borderRadius: "6px",
    transition: "background-color 0.3s ease, color 0.3s ease",
    padding: "10px",
    backgroundColor: "#88E788",
    color: "#fff",
    borderColor: "#444",
  },
  button: {
    backgroundColor: "#000",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 15px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  response: {
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#fff",
    borderRadius: "5px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
  },
  name: {
    fontWeight: "bold",
    marginBottom: "10px",
  },

  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  actionButtons: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "10px",
  },
  correctButton: {
    backgroundColor: "green",
    color: "white",
    padding: "5px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "10px",
  },
  partialButton: {
    backgroundColor: "orange",
    color: "white",
    padding: "5px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  optionBox: {
    padding: "10px",
    borderRadius: "4px",
    margin: "5px 0",
    cursor: "pointer",
    border: "1px solid #ccc",
  },
  textarea: {
    width: "100%",
    height: "80px",
    padding: "5px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginTop: "5px",
  },
};
export default TakeQuiz;
