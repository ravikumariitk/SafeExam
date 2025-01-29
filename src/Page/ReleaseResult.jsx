import React, { useEffect, useRef, useState } from 'react';
import { initSocket } from '../socket';
import { toast } from 'react-hot-toast';

function ReleaseResult({data}) {
  const socketRef = useRef(null);
  const [id, setId] = useState('');
  const[quizData,setQuizData] = useState([])

  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      socketRef.current.on('connect_error', (err) => handleErrors(err));
      socketRef.current.on('connect_failed', (err) => handleErrors(err));

      function handleErrors(e) {
        toast.error('Connection failed, try again later.');
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
    const loadingToastId = toast.loading('Releasing Result...');
     setTimeout(() => {
                toast.dismiss(loadingToastId);
              }, 5000);
    socketRef.current.emit('release-result', { id: id });
    socketRef.current.on('release-result-success', (data) => {
      toast.success('Result Released!', { id: loadingToastId });
    })
    socketRef.current.on('release-result-failed',()=>{
      toast.error('Result Release Failed!', { id: loadingToastId})
    })
  }

  const handleQuizClick = (quiz)=>{
    setId(quiz.id)
    handleSubmit();
  }
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Release Result</h2>
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
        <br />
        <div style = {{textAlign : 'center'}}>
          OR
        </div>
        <br />
        <div style={{textAlign:'center'}}>
      <input
        type="text"
        style={styles.input}
        placeholder="Enter Quiz ID"
        onChange={(e) => setId(e.target.value)}
      />&nbsp; &nbsp;
      <button style={styles.button} onClick={handleSubmit}>
        Release Result
      </button>
      </div>
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
};

export default ReleaseResult;
