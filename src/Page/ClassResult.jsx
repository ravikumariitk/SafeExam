import React, { useRef, useState, useEffect } from 'react';
import { initSocket } from '../socket';
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

function ClassResult({data}) {
  const [id, setId] = useState('');
  const [marks, setMarks] = useState({});
  const socketRef = useRef(null);
  const[quizData,setQuizData] = useState([])
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

  function handleSubmit() {
    const loadingToastId = toast.loading("Fetching Data...");
    setTimeout(() => {
      toast.dismiss(loadingToastId);
    }, 5000);
    socketRef.current.emit('get-class-result', { id });
    socketRef.current.on('get-class-result-response', ({ marks }) => {
      toast.success("Class Data Fetched!", { id: loadingToastId });
      setMarks(marks);
    });
  }

  const handleExportToExcel = () => {
    const sortedData = Object.entries(marks)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value], index) => ({
        Rank: index + 1,
        "Roll No.": key,
        Marks: value,
      }));
    const worksheet = XLSX.utils.json_to_sheet(sortedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Class Scores");
    XLSX.writeFile(workbook, "Class_Scores.xlsx");
  };

  const handleQuizClick = (quiz) =>{
    setId(quiz.id)
    handleSubmit();
  }
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Class Result</h2>

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
          <br />
      <input
        style={styles.input}
        type="text"
        placeholder="Enter Quiz ID"
        onChange={(e) => setId(e.target.value)}
      />
      &nbsp; &nbsp;
      <button style={styles.submitButton} onClick={handleSubmit}>
        Get Results
      </button></div>

      <div style={styles.resultsContainer}>
    {Object.entries(marks).length > 0 ? (
        <div>
          <h3>Class Scores:</h3>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Rank
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Roll No.
                </th>
                <th style={{ border: "1px solid black", padding: "8px" }}>
                  Marks
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(marks)
                .sort((a, b) => b[1] - a[1]) // Sort in descending order by marks
                .map(([key, value], index) => (
                  <tr key={key}>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {index + 1}
                    </td>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {key}
                    </td>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {value}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <button
            onClick={handleExportToExcel}
            style={{
              marginTop: "10px",
              padding: "10px 15px",
              backgroundColor: "black",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Export to Excel
          </button>
        </div>
      ) : (<p>No result Available</p>)}</div>
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
    padding: '10px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '60%',
    marginBottom: '10px',
  },
  submitButton: {
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 15px',
    cursor: 'pointer',
    marginTop: '10px',
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
  resultsContainer: {
    marginTop: '20px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
  },
  result: {
    padding: '8px 0',
    borderBottom: '1px solid #ddd',
  },
};

export default ClassResult;