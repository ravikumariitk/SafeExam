import React, { useState, useEffect, useRef } from "react";
import { initSocket } from "../socket";
import { toast } from "react-hot-toast";

function AnsKey({data}) {
  const [id, setId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const socketRef = useRef(null);
  const [quizData,setQuizData] = useState([])
  // console.log(data)
  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));
      function handleErrors(e) {
        toast.error("Connection Error! Try again later.");
      }
    }
    init();
    setTimeout(() => {
      socketRef.current.emit("get-quiz-name", {data})
      const id = toast.loading("Fetching Quiz Data...");
       setTimeout(() => {
                  toast.dismiss(id);
                }, 5000);
      socketRef.current.on('get-quiz-name-response', ({quiz}) => {
      toast.success("Quiz Fetched!", { id: id });
      setQuizData(quiz)
      console.log(quiz)
    })
    }, 100);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);
  const handleSubmit = () => {
    socketRef.current.emit("get-quiz", { id: id });
    const loadingToastId = toast.loading("Fetching Quiz Data...");
     setTimeout(() => {
                toast.dismiss(loadingToastId);
              }, 5000);
    socketRef.current.on("get-quiz-failed", () => {
      toast.error("Quiz not found.", { id: loadingToastId });
    });
    socketRef.current.on("get-quiz-response", ({ questions }) => {
      toast.success("Quiz Fetched!", { id: loadingToastId });
      setQuestions(questions);
      setAnswers(
        questions.map((q) => (q.type === "multiple-choice" ? [] : ""))
      );
    });
  };

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

  const handleQuizSubmit = () => {
    socketRef.current.emit("ans-key", { id: id, answers: answers });
    const loadingToastId = toast.loading("Releasing Answer Key...");
     setTimeout(() => {
                toast.dismiss(loadingToastId);
              }, 5000);
    socketRef.current.on("ans-key-success", () => {
      toast.success("Answer Key Released.", { id: loadingToastId });
    });
  };

  const handleOptionStyles = (index, value, answers, isCheckbox) => {
    if (isCheckbox) {
      return answers[index]?.includes(value)
        ? styles.optionSelected
        : styles.option;
    }
    return answers[index] === value ? styles.optionSelected : styles.option;
  };

  const handleQuizClick = (quiz) =>{
    // console.log(quiz.id);
    setId(quiz.id)
    console.log(id)
    handleSubmit()
  }

  return (
    <>
      <div style={styles.container}>
        <h2 style={styles.heading}>Answer Key</h2>
        <div style={styles.gridContainer}>
        {quizData.length > 0 ? (
          quizData.map((quiz, index) => (
            <div
              key={index}
              style={styles.quizContainer}
              onClick={() => handleQuizClick(quiz)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 12px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 8px rgba(0, 0, 0, 0.1)";
              }}
            >
              <h3>{quiz.title}</h3>
              <p>id: {quiz.id}</p>
              <div style={styles.batch}>
                <span style={styles.batchItem}>
                  {quiz.ansKeyReleased
                    ? "Anskey Released"
                    : "AnsKey Pending"}
                </span>
                <span style={styles.batchItem}>
                  {quiz.resultReleased ? "Result Released" : "Result Pending"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p>No quizzes available</p>
        )}
      </div>
      <br />
     <div style={{textAlign:'center'}}>OR</div>
      <br />
   
        <div style = {{textAlign:'center'}}>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter quiz ID"
            onChange={(e) => setId(e.target.value)}
          />
          &nbsp; &nbsp;
          <input
            style={styles.submitButton}
            type="submit"
            value="Fetch Exam"
            onClick={handleSubmit}
          />
          </div>
        

        {questions.length > 0 && (
          <div style={styles.questionsContainer}>
            {/* <h2
              style={styles.heading}
            >{`Answer Key for  : ${questions.id}`}</h2> */}
            {questions.map((question, index) => (
              <div key={index}  style={styles.question}>
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
                <p>{question.statement}</p>
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
                {question.type === "single-choice" && (
                  <div style={styles.optionsContainer}>
                    {question.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        style={handleOptionStyles(
                          index,
                          option,
                          answers,
                          false
                        )}
                        onClick={() => handleAnswerChange(index, option)}
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
            <button style={styles.submitButton} onClick={handleQuizSubmit}>
              Release Answer Key
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  heading: {
    textAlign: "center",
    color: "#333",
  },
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
  quizContainer: {
    padding: "20px",
    backgroundColor: "#ffffff",
    border: "1px solid #e3e4e6",
    borderRadius: "12px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  batch: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "10px",
  },
  batchItem: {
    padding: "6px 12px",
    backgroundColor: "#e3f7e8",
    color: "#28a745",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: "20px",
    display: "flex",
    gap: "10px",
  },
  input: {
    padding: "8px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    width: "60%",
  },
  submitButton: {
    backgroundColor: "#000",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 15px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  questionsContainer: {
    marginTop: "30px",
  },
  heading: {
    color: "#333",
    marginBottom: "15px",
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
  // marks: {
  //   display: 'flex',
  //   flexDirection: 'row',
  //   textAlign: 'right',
  // },
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
  textarea: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    height: "100px",
  },
};

export default AnsKey;