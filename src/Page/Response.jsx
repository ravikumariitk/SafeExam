import React, { useState, useEffect, useRef } from 'react';
import { initSocket } from '../socket';
import toast from 'react-hot-toast';

function Response() {
  const [id, setId] = useState('');
  const [questionData, setQuestionData] = useState([]);
  const [ansData, setAnsData] = useState([]);
  const socketRef = useRef(null);

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

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  function handleSubmit() {
    const toastId = toast.loading('Fetching Quiz Data...')
    socketRef.current.emit('get-response', { id: id });
    socketRef.current.on('get-response-result', ({ question, answers }) => {
      toast.success("Quiz Data Fatched!",{id:toastId})
      setQuestionData(question);
      setAnsData(answers);
    });
  }

  function markPartialCorrect(idx, roll) {
    const toastId = toast.loading('Marking Partially Correct...')
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


  function getOptionBoxColor(answer, correctOption, partialOption) {
    if(Object.values(answer).includes(correctOption)) return '#88E788'
    return '#ffffc5'
  }
  function subjective(obj){
    const array = []
    obj.score = ''
    obj.status = ""
    for(let key in obj){
      array.push(obj[key])
    }
    return array.reduce((acc,curr)=>{return acc+curr})
  
  }
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Class Responses</h2>
      <br />
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

      {ansData.map((ansEle, ansIndex) => (
        <div key={ansIndex} style={styles.response}>
          <div style={styles.name}>Roll No.: {ansEle.roll}</div>
          {ansEle.videoLink && (
            <div>
              <h4>Video Response:</h4>
              <video
                src={ansEle.videoLink}
                controls
                style={styles.video}
              >
                Your browser does not support the video tag.
              </video>
              <a href={ansEle.videoLink}>Click here to get video</a>
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
    width: '80%',
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
