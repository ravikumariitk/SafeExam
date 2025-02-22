import React, { useState, useEffect, useRef } from 'react';
import { initSocket } from '../socket';
import toast from 'react-hot-toast';

function Response({data}) {
  const [id, setId] = useState('');
  const [questionData, setQuestionData] = useState([]);
  const [ansData, setAnsData] = useState([]);
  const socketRef = useRef(null);
  const[quizData,setQuizData] = useState([])
  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      function handleErrors(e) {
        toast('Connection failed, try again later.');
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

  function handleSubmit() {
    const toastId = toast.loading('Fetching Quiz Data...')
     setTimeout(() => {
                toast.dismiss(toastId);
              }, 5000);
    socketRef.current.emit('get-response', { id: id });
    socketRef.current.on('get-response-result', ({ question, answers }) => {
      toast.success("Quiz Data Fatched!",{id:toastId})
      setQuestionData(question);
      setAnsData(answers);
    });
  }

  function markPartialCorrect(idx, roll) {
    const toastId = toast.loading('Marking Partially Correct...')
     setTimeout(() => {
                toast.dismiss(toastId);
              }, 5000);
    socketRef.current.emit('partial-correct', {
      id: id,
      roll: roll,
      questionNo: idx,
    });
    socketRef.current.on('partial-correct-success',()=>{
      toast.success('Marked as Partially Correct',{id: toastId})
    })
    socketRef.current.on('partial-correct-failed',()=>{
      toast.error('Something went wrong',{id:toastId})
    })
  }

  function markCorrect(idx, roll) {
    const toastId = toast.loading('Marking Correct...')
     setTimeout(() => {
                toast.dismiss(toastId);
              }, 5000);
    socketRef.current.emit('correct', {
      id: id,
      roll: roll,
      questionNo: idx,
    });
    socketRef.current.on('correct-success',()=>{
      toast.success('Marked as Correct',{id:toastId})
    })
    socketRef.current.on('correct-failed',()=>{
      toast.error('Something went wrong',{id:toastId})
    })
  }

  function markInCorrect(idx, roll) {
    const toastId = toast.loading('Marking Incorrect...')
     setTimeout(() => {
                toast.dismiss(toastId);
              }, 5000);
    socketRef.current.emit('incorrect', {
      id: id,
      roll: roll,
      questionNo: idx,
    });
    socketRef.current.on('incorrect-success',()=>{
      toast.success('Marked as Incorrect',{id:toastId})
    })
    socketRef.current.on('incorrect-failed',()=>{
      toast.error('Something went wrong',{id:toastId})
    })
  }


  function getOptionBoxColor(answer, correctOption) {
    if(answer){
    console.log(answer)
    if(Object.values(answer).includes(correctOption)) return '#88E788'}
    return '#ffffc5'
  }
  function subjective(obj){
    if(!obj) return ''
    const array = []
    obj.score = ''
    obj.status = ""
    for(let key in obj){
      array.push(obj[key])
    }
    return array.reduce((acc,curr)=>{return acc+curr})
  
  }

  const handleQuizClick = (quiz) => {
    setId(quiz.id);
    console.log(id);
    handleSubmit()
  }
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Class Responses</h2>
      <br />

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
      
      <div style = {{textAlign : 'center'}}>
        <br />
        OR
        < br / >
        <br/>
      <input
        type="text"
        placeholder="Enter Quiz ID"
        onChange={(e) => setId(e.target.value)}
        style={styles.input}
        /> &nbsp; &nbsp;
      <button onClick={handleSubmit} style={styles.button}
      >
        Fetch Responses
      </button>
       </ div>

      {ansData.map((ansEle, ansIndex) => (
        <div key={ansIndex} style={styles.response}>
          <div style={styles.name}>Roll No.: {ansEle.roll}</div>
          {ansEle.videoLink && (
            <div>
              
              <a href={ansEle.videoLink} target = "_blank">Click here to get video</a>
            </div>
          )}
          {questionData.map((quesEle, idx) => (
            <div key={idx} style={styles.question}>
              <div style={styles.questionHeader}>
                <div>
                  Q{idx + 1}: {quesEle.statement}
                </div>
                <div style={styles.marks}>
                  <span style={styles.correct}>+{quesEle.correctMarks || 0} / </span>
                  <span style={styles.incorrect}>{quesEle.incorrectMarks || 0} / </span>
                  <span style={styles.partial}>+{quesEle.partialMarks || 0}</span>
                </div>
              </div>
              <div style={styles.actionButtons}>
                <button
                  onClick={() => markCorrect(idx, ansEle.roll)}
                  style={styles.correctButton}
                >
                  Mark Correct
                </button>
                <button
                  onClick={() => markInCorrect(idx, ansEle.roll)}
                  style={styles.inCorrectButton}
                >
                  Mark Incorrect
                </button>
                <button
                  onClick={() => markPartialCorrect(idx, ansEle.roll)}
                  style={styles.partialButton}
                >
                  Mark Partial Correct
                </button>
              </div>

              {quesEle.type === 'multiple-choice' && (
                <div>
                  {quesEle.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      style={{
                        ...styles.optionBox,
                        backgroundColor: getOptionBoxColor(ansEle.answers[idx], option, quesEle.partialOption),
                      }}
                    >
                      {option}{' '}
                    </div>
                  ))}
                </div>
              )}
              {quesEle.type === 'subjective' && (
                <div>
                  <textarea
                    value={ subjective(ansEle.answers[idx]) }
                    readOnly
                    style={styles.textarea}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    // textAlign: 'center',
    color: '#333',
  },
  input: {
    padding: '8px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '60%',
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
  button: {
    backgroundColor: '#000',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 15px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  response: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  },
  name: {
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  question: {
    marginBottom: '15px',
  },
  questionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marks: {
    display: 'flex',
    flexDirection: 'row',
    textAlign: 'right',
  },
  correct: {
    color: 'green',
  },
  incorrect: {
    color: 'red',
  },
  partial: {
    color: 'orange',
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '10px',
  },
  correctButton: {
    backgroundColor: 'green',
    color: 'white',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  
  inCorrectButton: {
    backgroundColor: 'red',
    color: 'white',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  partialButton: {
    backgroundColor: 'orange',
    color: 'white',
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  optionBox: {
    padding: '10px',
    borderRadius: '4px',
    margin: '5px 0',
    cursor: 'pointer',
    border: '1px solid #ccc',
  },
  textarea: {
    width: '100%',
    height: '80px',
    padding: '5px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    marginTop: '5px',
  },
};

export default Response;
