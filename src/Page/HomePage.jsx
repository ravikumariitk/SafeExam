import React, { useRef, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { initSocket } from "../socket";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";

Modal.setAppElement("#root");

function HomePage({ email }) {
  const socketRef = useRef(null);
  const [name, setName] = useState("");
  const [quizData, setQuizData] = useState([]);
  const [editQuiz, setEditQuiz] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
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
           setTimeout(() => {
                      toast.dismiss(toastId);
                    }, 5000);
          socketRef.current.on("get-quiz-data-failed", () => {
            toast.error("Something went wrong", { id: toastId });
          });
          socketRef.current.on("get-quiz-data-response", ({ data }) => {
            setQuizData(data || []);
            toast.success("Data Fetched", { id: toastId });
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
    setSelectedQuiz(quiz);
  };
  const handleEditQuiz = (quiz) => {
    console.log(quiz);
    setSelectedQuiz(null);
    setEditQuiz(quiz);
  };

  const closeModal = () => {
    setSelectedQuiz(null);
  };
  const closeEditModal = () => {
    setEditQuiz(null);
  };

  function convertToNormalTime(isoTime) {
    const date = new Date(isoTime);

    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZoneName: "short",
    };

    return date.toLocaleString("en-US", options);
  }

  function getStatus(startTime, endTime) {
    const now = new Date(); 
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
      return "Yet to Start";
    } else if (now >= start && now <= end) {
      return "Live";
    } else {
      return "Finished";
    }
  }

  const handleSave = (quiz) => {
    console.log(quiz)
    socketRef.current.emit("edit-quiz", { quiz });
    const id = toast.loading("Updating your quiz...");
     setTimeout(() => {
                toast.dismiss(id);
              }, 5000);
    socketRef.current.on("edit-quiz-success", () => {
      toast.success("Quiz Updated", { id });
      setEditQuiz(null);
    });
    socketRef.current.on("edit-quiz-failed", () => {
      toast.error("Failed to update quiz", { id });
    });
  };

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
                <span style={styles.batchItem}>
                  {quiz.noOfResponses} Responses
                </span>
                <span style={styles.batchItem}>
                  {getStatus(quiz.startTime, quiz.endTime)}
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
            <strong>Instructions:</strong>
          </p>
          <br />
          <div
            style={{
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {selectedQuiz.instructions}
          </div>
          <br />
          <p>
            <strong>Start Time:</strong>{" "}
            {convertToNormalTime(selectedQuiz.startTime)}
          </p>
          <p>
            <strong>End Time:</strong>{" "}
            {convertToNormalTime(selectedQuiz.endTime)}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {getStatus(selectedQuiz.startTime, selectedQuiz.endTime)}
          </p>
          <p>
            <strong>Proctoring:</strong>{" "}
            {selectedQuiz.proctoring ? "Enabled" : "Disabled"}
          </p>
          <p>
            <strong>Display Mode:</strong>{" "}
            {selectedQuiz.displayMode === "all" ? "All" : "one by One"}
          </p>
          <p>
            <strong>Attempts:</strong>{" "}
            {selectedQuiz.allowMultipleSubmissions ? "Unlimited" : "Once"}
          </p>
          <p>
            <strong>Randomize Question Order:</strong>{" "}
            {selectedQuiz.randomizeQuestionOrder ? "Enabled" : "Disabled"}
          </p>
          <p>
            <strong>Shuffle Options:</strong>{" "}
            {selectedQuiz.shuffleOptions ? "Enabled" : "Disabled"}
          </p>
          <p>
            <strong>Password Protection:</strong>{" "}
            {selectedQuiz.passwordProtection ? "Enabled" : "Disabled"}
          </p>
          <p>
            <strong>Password:</strong> {selectedQuiz.password}
          </p>
          <p>
            <strong>Total Questions:</strong> {selectedQuiz.questions.length}
          </p>
          <p>
            <strong>Answer Key:</strong>{" "}
            {selectedQuiz.ansKeyReleased ? "Released" : "Pending"}
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
                  <strong>Type:</strong>{" "}
                  {question.type === "multiple-choice"
                    ? "Multiple Choice"
                    : "Subjective"}
                </p>
                <p>
                  <strong>Marks:</strong> +{question.correctMarks} /{" "}
                  {question.incorrectMarks} / +{question.partialMarks}
                </p>
                <p>
                  <strong>Time Limit:</strong> {question.time} seconds
                </p>

                {question.type === "multiple-choice" && (
                  <>
                    <p>
                      <strong>Options:</strong>
                    </p>
                    <div style={styles.optionsContainer}>
                      {question.options.map((option, optIdx) => (
                        <div key={optIdx} style={styles.optionBox}>
                          {option}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>
          <button
            onClick={() => handleEditQuiz(selectedQuiz)}
            style={styles.closeButton}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#005a4c")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#00796b")}
            disabled={
              getStatus(selectedQuiz.startTime, selectedQuiz.endTime) === "Live"
            }
          >
            {getStatus(selectedQuiz.startTime, selectedQuiz.endTime) !== "Live"
              ? "Edit Quiz"
              : "Cant Edit Quiz"}
          </button>{" "}
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

      {editQuiz && (
        <Modal
          isOpen={!!editQuiz}
          onRequestClose={closeModal}
          contentLabel="Quiz Details"
          style={{
            overlay: styles.modalOverlay,
            content: styles.modalContent,
          }}
        >
          <h2 style={styles.modalHeading}>
            <input
              style={{ fontSize: "30px", width: "100%" }}
              type="text"
              defaultValue={editQuiz.title}
              onChange={(e) => {
                editQuiz.title = e.target.value;
              }}
            />
          </h2>
          <p>
            <strong>Quiz ID:</strong>{editQuiz.id}
          </p>
          <p>
            <strong>Instructions:</strong>
          </p>
          <br />
          <div
            style={{
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <textarea
              style={{ width: "100%" }}
              name=""
              id=""
              cols="100"
              onChange={(e) => {
                editQuiz.instructions = e.target.value;
              }}
            >
              {editQuiz.instructions}
            </textarea>
          </div>
          <br />
          <p>
            <strong>Start Time:</strong>
            <input
              type="datetime-local"
              name=""
              id=""
              onChange={(e) => {
                editQuiz.startTime = e.target.value;
              }}
            />
          </p>
          <p>
            <strong>End Time:</strong>{" "}
            <input
              type="datetime-local"
              name=""
              id=""
              onChange={(e) => {
                editQuiz.endTime = e.target.value;
              }}
            />{" "}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {getStatus(editQuiz.startTime, editQuiz.endTime)}
          </p>
          <p>
            <strong>Proctoring:</strong>
            <input
            type="checkbox"
            defaultChecked={editQuiz.proctoring}
            onChange={(e) => {
              editQuiz.proctoring = e.target.checked;
            }}
          />
          </p>
          <p>
            <strong>Display Mode:</strong>
            <select
              name=""
              id=""
              onChange={(e) => {
                editQuiz.displayMode = e.target.value;
              }}
            >
              <option value="all">All</option>
              <option value="one-by-one">One by One</option>
            </select>
          </p>
          <p>
            <strong>Allow Multiple Submissionss:</strong>
            <input
              type="checkbox"
              defaultChecked={editQuiz.allowMultipleSubmissions}
              onChange={(e) => {
                editQuiz.allowMultipleSubmissions = e.target.checked;
              }}
            />
          </p>
          <p>
            <strong>Randomize Question Order:</strong>{" "}
            <input
              type="checkbox"
              name=""
              id=""
              defaultChecked={editQuiz.randomizeQuestionOrder}
              onChange={(e) => {
                editQuiz.randomizeQuestionOrder = e.target.checked;

              }}
            />
          </p>
          <p>
            <strong>Shuffle Options:</strong>{" "}
            <input
              type="checkbox"
              name=""
              id=""
              defaultChecked={editQuiz.shuffleOptions}
              onChange={(e) => {
                editQuiz.shuffleOptions = e.target.checked;
              }}
            />
          </p>
          <p>
            <strong>Password Protection:</strong>
            <input
              type="checkbox"
              name=""
              id=""
              defaultChecked={editQuiz.passwordProtection}
              onChange={(e) => {
                editQuiz.passwordProtection = e.target.checked;
              }}
            />
          </p>
          <p>
            <strong>Password:</strong>
            <input
              type="text"
              defaultValue={editQuiz.password}
              onChange={(e) => {
                editQuiz.password = e.target.value;
              }}
            />
          </p>
          <p>
            <strong>Total Questions:</strong> {editQuiz.questions.length}
          </p>
          <p>
            <strong>Answer Key:</strong>{" "}
            {editQuiz.answerKeyReleased ? "Released" : "Pending"}
          </p>
          <p>
            <strong>Results:</strong>{" "}
            {editQuiz.resultReleased ? "Released" : "Pending"}
          </p>
          <br />
          <h3 style={styles.modalSubheading}>Questions:</h3>
          <ol>
            {editQuiz.questions.map((question, idx) => (
              <li key={idx} style={styles.questionItem}>
                <p>
                  <strong>Statement:</strong>
                  <input
                    type="text"
                    defaultValue={question.statement}
                    onChange={(e) => {
                      editQuiz.questions[idx].statement = e.target.value;
                    }}
                  />
                </p>
                <p>
                  <strong>Type:</strong>{" "}
                  {question.type === "multiple-choice"
                    ? "Multiple Choice"
                    : "Subjective"}
                </p>
                <p>
                  <strong>Marks:</strong> +
                  <input
                    type="number"
                    name=""
                    id=""
                    defaultValue={question.correctMarks}
                    onChange={(e) => {
                      editQuiz.questions[idx].correctMarks = e.target.value;
                    }}
                  />{" "}
                  /{" "}
                  <input
                    type="number"
                    name=""
                    id=""
                    defaultValue={question.incorrectMarks}
                    onChange={(e) => {
                      editQuiz.questions[idx].incorrectMarks = e.target.value;
                    }}
                  />{" "}
                  / +
                  <input
                    type="number"
                    defaultValue={question.partialMarks}
                    onChange={(e) => {
                      editQuiz.question[idx].partialMarks = e.target.value;
                    }}
                  />
                </p>
                <p>
                  <strong>Time Limit:</strong>{" "}
                  <input
                    type="number"
                    name=""
                    id=""
                    defaultValue={question.time}
                    onChange={(e) => {
                      editQuiz.questions[idx].time = e.target.value;
                    }}
                  />{" "}
                  seconds
                </p>
                {question.type === "multiple-choice" && (
                  <>
                    <p>
                      <strong>Options:</strong>
                    </p>
                    <div style={styles.optionsContainer}>
                      {question.options.map((option, optIdx) => (
                        <div key={optIdx} style={styles.optionBox}>
                          <textarea
                            name=""
                            id=""
                            onChange={(e) => {
                              editQuiz.questions[idx].options[optIdx] =
                                e.target.value;
                            }}
                          >
                            {option}
                          </textarea>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ol>
          <button
            onClick={() => handleSave(editQuiz)}
            style={styles.closeButton}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#005a4c")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#00796b")}
          >
            Save
          </button>
          &nbsp;
          <button
            onClick={closeEditModal}
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
    backgroundColor: "#f1f5f9",
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
