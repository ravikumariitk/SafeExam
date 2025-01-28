import React, { useRef, useState, useEffect } from 'react';
import { initSocket } from '../socket';
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

function ClassResult() {
  const [id, setId] = useState('');
  const [marks, setMarks] = useState({});
  const socketRef = useRef(null);

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
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  function handleSubmit() {
    socketRef.current.emit('get-class-result', { id });
    const loadingToastId = toast.loading("Fetching Data...");
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

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Class Result</h2>
      <input
        style={styles.input}
        type="text"
        placeholder="Enter Quiz ID"
        onChange={(e) => setId(e.target.value)}
      />
      &nbsp; &nbsp;
      <button style={styles.submitButton} onClick={handleSubmit}>
        Get Results
      </button>

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