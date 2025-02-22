import React, { useEffect, useRef, useState } from "react";
import { initSocket } from "../socket";
import { toast } from "react-hot-toast";

function GetAnsKey({data}) {
  const [id, setId] = useState("");
  const [ansKey, setAnsKey] = useState(null);
  const [questions, setQuestions] = useState(null);
  const socketRef = useRef(null);
  const[quizData,setQuizData] = useState([])
  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        toast.error("Connection Error. Try again later.");
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
    socketRef.current.emit("getAnsKey", id);
    const loadingToastId = toast.loading("Fetching Quiz Data...");
     setTimeout(() => {
                toast.dismiss(loadingToastId);
              }, 5000);
    socketRef.current.on("getAnsKey-response", ({ ansKey, questions }) => {
      toast.success("Quiz data Fetched!", { id: loadingToastId });
      setQuestions(questions);
      setAnsKey(ansKey);
    });
    socketRef.current.on("getAnsKey-failed", () => {
      toast.error("Ans Key not released or quiz may not exist.", {
        id: loadingToastId,
      });
    });
  };
  const handleQuizClick = (quiz) =>{
    setId(quiz.id);
    handleSubmit()
  }
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Fetch Answer Key</h2>
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
      <div style = {{textAlign:'center'}}>
        <br />
        OR
        <br />
      <input
        style={styles.input}
        type="text"
        placeholder="Enter Quiz ID"
        onChange={(e) => setId(e.target.value)}
      />
      &nbsp; &nbsp;
      <button style={styles.button} onClick={handleSubmit}>
        Fetch AnsKey
      </button>
      </div>
      {ansKey && (
        <div style={styles.ansKeyContainer}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={styles.ansKeyHeading}>
              Answer Key for: {questions.title}
            </h3>
            <span
              style={{ fontSize: "18px", fontWeight: "bold", color: "#4CAF50" }}
            >
            </span>
          </div>
          {ansKey && (
            <div>
              {questions.questions.map((question, index) => (
                <div key={index} style={styles.questionContainer}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h4>
                      Q{index + 1}: {question.statement}
                    </h4>
                    <span style={{ fontSize: "14px", color: "#007bff" }}>
                      <span style={styles.correct}>
                        +{question.correctMarks || 0} /{" "}
                      </span>
                      <span style={styles.incorrect}>
                        {question.incorrectMarks || 0} /{" "}
                      </span>
                      <span style={styles.partial}>
                        +{question.partialMarks || 0}
                      </span>
                    </span>
                  </div>
                  <ul style={styles.optionsContainer}>
                    {question.type === "multiple-choice" &&
                      question.options.map((option, optIndex) => (
                        <li
                          key={optIndex}
                          style={{
                            ...styles.option,
                            backgroundColor: ansKey.answers[index].includes(
                              option
                            )
                              ? "#88E788"
                              : "#FF6961",
                          }}
                        >
                          {option}
                        </li>
                      ))}
                    {question.type === "subjective" && (
                      <textarea
                        style={styles.textarea}
                        value={ansKey.answers[index] || ""}
                        placeholder="Enter your answer"
                      />
                    )}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
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
  heading: {
    // textAlign: 'center',
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
  ansKeyContainer: {
    padding: "20px",
    borderRadius: "10px",
    backgroundColor: "#f9f9f9",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  ansKeyHeading: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  questionContainer: {
    marginBottom: "20px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#fff",
  },
  optionsContainer: {
    listStyleType: "none",
    padding: 0,
  },
  option: {
    padding: "10px",
    margin: "5px 0",
    borderRadius: "5px",
    cursor: "default",
  },
  input: {
    padding: "10px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    width: "60%",
    marginBottom: "10px",
  },
  button: {
    backgroundColor: "black",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 15px",
    cursor: "pointer",
    marginTop: "10px",
  },
  buttonHover: {
    backgroundColor: "#444",
  },
  ansKeyContainer: {
    marginTop: "30px",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#fff",
  },
  ansKeyHeading: {
    fontSize: "18px",
    marginBottom: "15px",
    color: "#333",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    height: "100px",
  },
  answer: {
    marginBottom: "15px",
    fontSize: "16px",
    padding: "10px",
    borderRadius: "6px",
    backgroundColor: "#f1f1f1",
    border: "1px solid #ccc",
  },
  answerOption: {
    padding: "5px 0",
    fontSize: "14px",
    color: "#333",
  },
};

export default GetAnsKey;