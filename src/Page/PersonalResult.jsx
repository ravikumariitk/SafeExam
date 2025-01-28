import React, { useRef, useState, useEffect } from "react";
import { initSocket } from "../socket";
import { toast } from "react-toastify";
function PersonalResult({ email }) {
  const [id, setId] = useState("");
  const [response, setResponse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [ansKey, setAnsKey] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        toast.error("Connection error, try again later.");
      }
    }
    init();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  function handleSubmit() {
    const loadingToastId = toast.loading("Fetching Data...");
    socketRef.current.emit("get-personal-result", {
      id: id,
      email: email,
    });

    socketRef.current.on(
      "get-personal-result-response",
      ({ response, questions, ansKey }) => {
        toast.success("Data Fetched!", { id: loadingToastId });
        setResponse(response);
        setQuestions(questions);
        setAnsKey(ansKey);
      }
    );
  }

  const calculateTotalMarks = () => {
    return Object.values(response?.answers || {}).reduce(
      (total, answer) => total + (answer.marks || 0),
      0
    );
  };

  const handleSubjective = (answer) => {
    const newObj = { ...answer };
    newObj.status = "";
    newObj.marks = "";
    let ans = "";
    for (let key in newObj) {
      ans += answer[key];
    }
    return ans;
  };
  let totalScore = 0;
  const getMarks = (index) => {
    if (response.answers[index].status === "correct") {
      totalScore += response.answers[index].marks;
      return (
        <span style={styles.correct}> +{response.answers[index].marks} </span>
      );
    } else if (response.answers[index].status === "incorrect") {
      totalScore += response.answers[index].marks;
      return (
        <span style={styles.incorrect}> {response.answers[index].marks} </span>
      );
    } else if (response.answers[index].status === "partial") {
      totalScore += response.answers[index].marks;
      return (
        <span style={styles.partial}> +{response.answers[index].marks} </span>
      );
    } else {
      return <span style={styles.partial}>Pending</span>;
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Personal Result</h2>
      <input
        style={styles.input}
        type="text"
        placeholder="Enter Quiz ID"
        onChange={(e) => setId(e.target.value)}
      />{" "}
      &nbsp; &nbsp;
      <button style={styles.button} onClick={handleSubmit}>
        Get Result
      </button>
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
                  {getMarks(index)}
                </span>
              </div>
              <ul style={styles.optionsContainer}>
                {question.type === "multiple-choice" &&
                  question.options.map((option, optIndex) => (
                    <li
                      key={optIndex}
                      style={{
                        ...styles.option,
                        backgroundColor: ansKey.answers[index].includes(option)
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
                    value={handleSubjective(response.answers[index])}

                    placeholder="Enter your answer"
                  />
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div>Total Marks : {totalScore}</div>
    </div>
  );
}

const styles = {
  container: {
    width: "80%",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    // textAlign: "center",
    color: "#333",
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
  resultContainer: {
    marginTop: "20px",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "#fff",
  },
  questionBlock: {
    padding: "10px 0",
    borderBottom: "1px solid #ddd",
  },
  totalMarks: {
    marginTop: "20px",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
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

export default PersonalResult;