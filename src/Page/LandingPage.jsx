import React from "react";
import { useNavigate } from "react-router-dom";

const QuizApp = () => {
  const navigate = useNavigate();
  function getStarted(){
    navigate('/signup')
  }
  function login(){
    navigate('/signin')
  }
  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h2>SafeExam</h2>
        <div>
          <button style={styles.button} onClick={getStarted}>Get Started</button>
          <button style={styles.button} onClick={login}>Login</button>
        </div>
      </div>
      <div style={styles.mainSection}>
        <div style={styles.header}>Transform the way exams are conducted</div>
        <div style={styles.subheader}>
          AI-driven proctoring, real-time response tracking, AI-generated questions, and fully customizable exams.
        </div>
        <div style={styles.buttonContainer}>
          <button style={styles.button} onClick={getStarted}>Get Started</button>
          <button style={styles.button}>Learn More</button>
        </div>
      </div>
      <div style={styles.footer}>
        <p>© 2025 QuizApp. All rights reserved.</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "100vw",
    marginTop : '0px',
    height: "94vh",
    backgroundColor: "white", // Light blue shade
    color: "#000",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },
  navbar: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    padding: "20px 40px",
    borderBottom: "2px solid #000",
  },
  button: {
    padding: "10px 20px",
    border: "none",
    backgroundColor: "#000",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: "5px",
    marginLeft: "10px",
    transition: "transform 0.3s ease, background-color 0.3s ease",
  },
  buttonHover: {
    transform: "scale(1.1)",
    backgroundColor: "#0056b3",
  },
  mainSection: {
    width: "100%",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  header: {
    fontSize: "48px",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  subheader: {
    fontSize: "18px",
    maxWidth: "600px",
    marginBottom: "20px",
  },
  buttonContainer: {
    display: "flex",
    gap: "15px",
  },
  footer: {
    marginTop: "auto",
    padding: "20px 0",
    textAlign: "center",
    borderTop: "2px solid #000",
    width: "100%",
  },
};

export default QuizApp;