import React, { useRef, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { initSocket } from "../socket";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";

// Configure the root app element for accessibility
Modal.setAppElement("#root");

function HomePage({ email , role}) {
  const socketRef = useRef(null);
  const [name, setName] = useState("");
  const [quizData, setQuizData] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [ans, setAns] = useState([]);
  const navigate = useNavigate();

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
      socketRef.current.emit("get-user-data", { email: email });
      socketRef.current.on("get-user-data-response", ({ data }) => {
        if (data && data.length > 0) {
          setName(data[0].name);
          socketRef.current.emit("get-quiz-data", { quiz: data[0].quiz });
          const toastId = toast.loading("Fetching your data...");
          socketRef.current.on("get-quiz-data-failde", () => {
            toast.error("Something went wrong", { id: toastId });
          });
          socketRef.current.on("get-quiz-data-response", ({ data }) => {
            setQuizData(data || []);
            toast.success("Data Fetched", { id: toastId });
            const ids = [];
            data.forEach((quiz) => {
                ids.push(quiz.id);
            })
            socketRef.current.emit("get-answer-data",{email:email, ids: ids});
            socketRef.current.on("get-answer-data-response", ({data}) => {
                console.log(data);
                setAns(data);
                });
          });
        } else {
          toast.error("Something went wrong");
          navigate("/");
        }
      });
      socketRef.current.on("get-user-data-failed", () => {
        toast.error("Something went wrong");
        navigate("/");
      });
    }, 1);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [email, navigate]);

  const handleQuizClick = (quiz) => {
    setSelectedQuiz(quiz); // Set the selected quiz to open in a modal
  };
  const closeModal = () => {
    setSelectedQuiz(null); // Close the modal
  };
  function convertToNormalTime(isoTime) {
    // Create a Date object from the ISO string
    const date = new Date(isoTime);

    // Options for formatting the date and time
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // For 12-hour format with AM/PM
      timeZoneName: "short",
    };

    // Format the date using toLocaleString
    return date.toLocaleString("en-US", options);
  }

  function getStatus(startTime, endTime) {
    const now = new Date(); // Current time
    const start = new Date(startTime); // Convert start time to Date object
    const end = new Date(endTime); // Convert end time to Date object

    if (now < start) {
      return "Yet to Start";
    } else if (now >= start && now <= end) {
      return "Live";
    } else {
      return "Finished";
    }
  }
  const getIndex = (id, index,option) => {
    const idx = ans.findIndex((quiz) => quiz.id === id); 
    console.log(ans[idx])
    console.log(idx);
    if(ans[idx].answers[index]) return Object.values(ans[idx].answers[index]).includes(option)?"(Choosen)" :"";
  }
  const getObj = (id, index) => {
    const idx = ans.findIndex((quiz) => quiz.id === id); 
    console.log(ans[idx])
    console.log(idx);
    if(ans[idx].answers[index]){
      console.log(ans[idx].answers[index])
      ans[idx].answers[index].score = "";
      ans[idx].answers[index].status = "";
      let result = ""
      Object.values(ans[idx].answers[index]).forEach((value) => {
          result+=value;
      })
      
      console.log(result)
      return result
    }
  }
  return (
    <div style={styles.container}>
      <h2>Hi {name}! What's up</h2>
      <br />
      <h4>Your Quizzes</h4>
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

      {/* Modal to display quiz details */}
      {selectedQuiz && (
        <Modal
          isOpen={!!selectedQuiz}
          onRequestClose={closeModal}
          contentLabel="Quiz Details"
          style={{
            overlay: styles.modalOverlay,
            content: styles.modalContent,
          }}
        >
          <h2 style={styles.modalHeading}>{selectedQuiz.title}</h2>
          <p>
            <strong>Quiz ID:</strong> {selectedQuiz.id}
          </p>
          <p>
            <strong>Answer Key:</strong>{" "}
            {selectedQuiz.answerKeyReleased ? "Released" : "Pending"}
          </p>
          <p>
            <strong>Results:</strong>{" "}
            {selectedQuiz.resultReleased ? "Released" : "Pending"}
          </p>
          <br />
          <h3 style={styles.modalSubheading}>Questions:</h3>
          <ol>
            {selectedQuiz.questions.map((question, idx) => (
              <li key={idx} style={styles.questionItem}>
                <p>
                  <strong>Statement:</strong> {question.statement}
                </p>
                <p>
                  <strong>Marks:</strong> +{question.correctMarks} /{" "}
                  {question.incorrectMarks} / +{question.partialMarks}
                </p>
                {question.type === "multiple-choice" && (
                  <>
                    <p>
                      <strong>Options:</strong>
                    </p>
                    <div style={styles.optionsContainer}>
                      {question.options.map((option, optIdx) => (
                        <div key={optIdx} style={{
                            ...styles.optionBox,
                            backgroundColor: getIndex(selectedQuiz.id, idx, option) === "(Choosen)" ? "#88E788" : "#ffffc5"
                          }}
                          >
                          {option}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                 {question.type === "subjective" && (
                  <>
                  <textarea name="" id="" style={{
                    width : "100%",
                  }}
                  readOnly
                  >{getObj(selectedQuiz.id, idx)}</textarea>
                  </>
                )}
              </li>
            ))}
          </ol>

          &nbsp;
          <button
            onClick={closeModal}
            style={styles.closeButton}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#005a4c")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#00796b")}
          >
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    height: "100%",
    padding: "20px",
    backgroundColor: "#f5f7fa",
    fontFamily: "'Inter', sans-serif",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
    marginTop: "20px",
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
  questionItem: {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f9fafc",
    border: "1px solid #e3e4e6",
    borderRadius: "8px",
  },
  optionsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "10px",
  },
  optionBox: {
    padding: "10px 15px",
    // backgroundColor: "#f1f5f9",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
  modalContent: {
    width: "70%",
    margin: "auto",
    padding: "30px",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(5px)",
  },
  modalHeading: {
    marginBottom: "20px",
    fontSize: "1.8rem",
    fontWeight: "600",
    color: "#333333",
  },
  modalSubheading: {
    marginBottom: "10px",
    fontSize: "1.2rem",
    fontWeight: "500",
    color: "#555555",
  },
  closeButton: {
    marginTop: "20px",
    padding: "12px 18px",
    backgroundColor: "#00796b",
    color: "#ffffff",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
};

export default HomePage;
