import React, { useEffect, useRef, useState } from "react";
import { initSocket } from "../socket";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";

const QuizForm = ({email}) => {
  // const { email } = useParams();
  const [questions, setQuestions] = useState([]);
  const [displayMode, setDisplayMode] = useState("all");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allowMultipleSubmissions, setAllowMultipleSubmissions] = useState(false);
  const [proctoring, setProctoring] = useState(false);
  const [randomizeQuestionOrder, setRandomizeQuestionOrder] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [passwordProtection, setPasswordProtection] = useState(false);
  const [password, setPassword] = useState('null')
  const [gradeVisibility, setGradeVisibility] = useState(false);
  const socketRef = useRef(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    type: "multiple-choice",
    statement: "",
    options: [""],
    time: 0,
    correctMarks: 0,
    incorrectMarks : 0,
    partialMarks : 0
  });

  const handleStatementChange = (e) => {
    setCurrentQuestion({ ...currentQuestion, statement: e.target.value });
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
  };

  const handleTimeChange = (e) => {
    setCurrentQuestion({ ...currentQuestion, time: e.target.value });
  };

  const handleCorrectMarksChange = (e) => {
    setCurrentQuestion({ ...currentQuestion, correctMarks: e.target.value });
  };
  const handleIncorrectMarksChange = (e) => {
    setCurrentQuestion({ ...currentQuestion, incorrectMarks: e.target.value });
  };
  const handlePartialMarksChange = (e) => {
    setCurrentQuestion({ ...currentQuestion, partialMarks: e.target.value });
  };
  const handleQuestionTypeChange = (e) => {
    setCurrentQuestion({
      ...currentQuestion,
      type: e.target.value,
      options: e.target.value === "subjective" ? [] : [""],
    });
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, ""],
    });
  };

  const addQuestion = () => {
    if (currentQuestion.statement.trim()) {
      setQuestions([...questions, currentQuestion]);
      setCurrentQuestion({
        type: "multiple-choice",
        statement: "",
        options: [""],
        time: 0,
        correctMarks: 0,
        incorrectMarks : 0,
        partialMarks: 0
      });
    }
  };

  const deleteQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const Publish = () => {
    const id = uuidv4();
    if(title === "" || instructions === "" ||startTime === "" || endTime === ""){
      toast.error("Fill all the required Fields.");
    }
    else{
      const loadingToastId = toast.loading("Publishing Quiz...");
    socketRef.current.emit("publish", { 
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
      password
    });
    socketRef.current.on("publish-success", ({ id }) => {
      toast.success("Quiz Published!", { id: loadingToastId });
      alert(`Quiz is published with code: ${id}.`);
    });
    socketRef.current.on("publish-failed", () => {
      toast.error("Quiz could not be published.", { id: loadingToastId });
    });
  }}

  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        toast.error("Connection failed, try again later.");
      }
    }
    init();
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  return (
    <div style={styles.quizForm}>
      <h1 style={styles.heading}>Create a Quiz</h1>

      <div style={styles.formGroup}>
        <label>Title:</label>
        <input
          type="text"
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter quiz title"
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label>Instructions:</label>
        <textarea
          style={styles.input}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter instructions for the quiz"
          required
        />
      </div>
    <span>

      <div style={styles.formGroup}>
        <label>Start Time:</label>
        <input
          type="datetime-local"
          style={styles.input}
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>
      <div style={styles.formGroup}>
        <label>End Time:</label>
        <input
          type="datetime-local"
          style={styles.input}
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>
      </span>
      <div style={styles.formGroup}>
        <label>Allow Multiple Submissions:</label>
        <input
          type="checkbox"
          checked={allowMultipleSubmissions}
          onChange={() => setAllowMultipleSubmissions(!allowMultipleSubmissions)}
        />
      </div>

      <div style={styles.formGroup}>
        <label>Proctoring:</label>
        <input
          type="checkbox"
          checked={proctoring}
          onChange={() => setProctoring(!proctoring)}
        />
      </div>
      <div style={styles.formGroup}>
        <label>Randomize Question Order:</label>
        <input
          type="checkbox"
          checked={randomizeQuestionOrder}
          onChange={() => setRandomizeQuestionOrder(!randomizeQuestionOrder)}
        />
      </div>

      <div style={styles.formGroup}>
        <label>Shuffle Options:</label>
        <input
          type="checkbox"
          checked={shuffleOptions}
          onChange={() => setShuffleOptions(!shuffleOptions)}
        />
      </div>

      <div style={styles.formGroup}>
        <label>Password Protection:</label>
        <input
          type="checkbox"
          checked={passwordProtection}
          onChange={() => setPasswordProtection(!passwordProtection)}
        />
      </div>
      { passwordProtection &&   <div style={styles.formGroup}>
        <label>Password :</label>
        <input
          type="text"
          style={styles.input}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter quiz Password"
        />
      </div>}
      <div style={styles.formGroup}>
        <label>Display Mode:</label>
        <select
          style={styles.select}
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value)}
        >
          <option value="all">Display All Questions at Once</option>
          <option value="one-by-one">Display One Question at a Time</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label>Question Type:</label>
        <select
          style={styles.select}
          value={currentQuestion.type}
          onChange={handleQuestionTypeChange}
        >
          <option value="multiple-choice">Multiple Choice</option>
          <option value="subjective">Subjective</option>
        </select>
      </div>

      <div style={styles.formGroup}>
        <label>Question Statement:</label>
        <input
          type="text"
          style={styles.input}
          value={currentQuestion.statement}
          onChange={handleStatementChange}
          placeholder="Enter the question statement"
        />
      </div>

      {currentQuestion.type === "multiple-choice" &&
        currentQuestion.options.map((option, index) => (
          <div style={styles.formGroup} key={index}>
            <label>
              Option {String.fromCharCode(65 + index)}:
            </label>
            <input
              type="text"
              style={styles.input}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
            />
          </div>
        ))}

      {currentQuestion.type === "multiple-choice" && (
        <button style={styles.link} onClick={addOption}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = styles.linkHover.backgroundColor
          e.target.style.color = styles.linkHover.color
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = styles.link.backgroundColor
          e.target.style.color = styles.link.color
        }}
        >
          Add Option
        </button>
      )}

      <div style={styles.formGroup}>
        <label>Time (in seconds):</label>
        <input
          type="number"
          style={styles.input}
          value={currentQuestion.time}
          onChange={handleTimeChange}
          placeholder="Enter time for this question"
        />
      </div>

      <div style={styles.formGroup}>
        <label>Correct Marks:</label>
        <input
          type="number"
          style={styles.input}
          value={currentQuestion.correctMarks}
          onChange={handleCorrectMarksChange}
          placeholder="Enter marks for this question"
        />
      </div>
      <div style={styles.formGroup}>
        <label>Incorrect Marks:</label>
        <input
          type="number"
          style={styles.input}
          value={currentQuestion.incorrectMarks}
          onChange={handleIncorrectMarksChange}
          placeholder="Enter marks for this question"
        />
      </div>
      <div style={styles.formGroup}>
        <label>Partial Marks:</label>
        <input
          type="number"
          style={styles.input}
          value={currentQuestion.partialMarks}
          onChange={handlePartialMarksChange}
          placeholder="Enter marks for this question"
        />
      </div>
      <button style={styles.link}
       onMouseEnter={(e) => {
        e.target.style.backgroundColor = styles.linkHover.backgroundColor
        e.target.style.color = styles.linkHover.color
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = styles.link.backgroundColor
        e.target.style.color = styles.link.color
      }}
      onClick={addQuestion}>
        Add Question
      </button>
      &nbsp;
      <button style={styles.link} onClick={Publish}
       onMouseEnter={(e) => {
        e.target.style.backgroundColor = styles.linkHover.backgroundColor
        e.target.style.color = styles.linkHover.color
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = styles.link.backgroundColor
        e.target.style.color = styles.link.color
      }}
      >
        Publish Quiz
      </button>

      <div style={styles.questionsList}>
        <h2 style={styles.subHeading}>All Questions</h2>
        {questions.map((q, index) => (
        <div key={index} style={styles.questionItem}>
          <div style={styles.questionHeader}>
            <div style={styles.questionText}>
              Q{index + 1}: {q.statement} ({q.type})
            </div>
            <div style={styles.scoreTime}>
              <p>Time: {q.time} sec</p>
              <p>
                +{q.correctMarks} / {q.incorrectMarks} / +{q.partialMarks}
              </p>
              <button onClick={() => deleteQuestion(index)}>Delete</button>
            </div>
          </div>

          {q.type === 'multiple-choice' && (
            <ul style={styles.optionsList}>
              {q.options.map((option, i) => (
                <li
                  key={i}
                  style={styles.optionItem}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#88E788'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffc5'}
                >
                  {String.fromCharCode(65 + i)}. {option}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      </div>
    </div>
  );
};

const styles = {
  questionItem: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '20px',
    borderBottom: '2px solid #ccc',
    paddingBottom: '20px',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  questionText: {
    fontSize: '18px',
    fontWeight: 'bold',
    flex: 1,
  },
  scoreTime: {
    textAlign: 'right',
    fontSize: '14px',
    color: '#888',
  },
  optionsList: {
    listStyle: 'none',
    padding: 0,
    margin: '10px 0',
  },
  optionItem: {
    padding: '10px',
    backgroundColor: '#f9f9f9',
    marginBottom: '8px',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  optionItemHover: {
    backgroundColor: '#eafaf0',
  },
  linksContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
  },
  link: {
    width : 'fit-content',
    fontSize: '1rem',
    
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    // width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    backgroundColor: 'black',
    color: 'white',
  },
  linkHover: {
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  quizForm: {
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
    textAlign: "center",
    color: "#333",
    marginBottom: "20px",
  },
  subHeading: {
    color: "#555",
    marginTop: "30px",
  },
  formGroup: {
    marginBottom: "15px",
  },
  input: {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  select: {
    width: "100%",
    padding: "8px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 15px",
    cursor: "pointer",
    marginTop: "10px",
  },
  publishButton: {
    backgroundColor: "#007BFF",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 15px",
    cursor: "pointer",
    marginTop: "10px",
  },
  questionsList: {
    marginTop: "30px",
  },
  questionItem: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "15px",
    marginBottom: "10px",
  },
};

export default QuizForm;
