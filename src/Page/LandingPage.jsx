import React from "react";

const LandingPage = () => {
  return (
    <div style={styles.container}>
      <section style={styles.heroSection}>
        <div style={styles.heroText}>
          <h1 style={styles.mainTitle}>Next Generation <br /> Quizzing</h1>
          <div style={styles.buttonContainer}>
            <button style={styles.button}>Login</button>
            <button style={styles.button}>Get Started</button>
          </div>
        </div>
      </section>
      
      <section style={styles.whyToUse}>
        <h2 style={styles.sectionTitle}>Why Choose QuizMaster?</h2>
        <p>Transform the way quizzes are conducted with AI-driven proctoring, real-time response tracking, and fully customizable exams.</p>
        <ul style={styles.featureList}>
          <li>📢 Host engaging quizzes effortlessly</li>
          <li>📊 Get real-time response insights</li>
          <li>📝 Manual evaluation for custom grading</li>
          <li>🔄 Randomized questions & options for fairness</li>
          <li>🚀 Secure and AI-powered proctoring</li>
          <li>📥 Export results for deeper analysis</li>
          <li>✏️ Edit exams on the go</li>
        </ul>
      </section>
      
      <footer style={styles.footer}>
        <p>© 2025 QuizMaster. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    backgroundColor: "#f4f4f4",
    minHeight: "100vh",
  },
  heroSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "50vh",
    backgroundColor: "#6200ea",
    color: "white",
    padding: "20px",
    textAlign: "left",
  },
  heroText: {
    maxWidth: "600px",
  },
  mainTitle: {
    fontSize: "3.5em",
    marginBottom: "20px",
  },
  buttonContainer: {
    display: "flex",
    gap: "15px",
  },
  button: {
    backgroundColor: "#03dac6",
    color: "black",
    border: "none",
    padding: "12px 24px",
    fontSize: "1.2em",
    cursor: "pointer",
    borderRadius: "5px",
    transition: "background 0.3s ease",
  },
  whyToUse: {
    backgroundColor: "white",
    padding: "40px 20px",
    margin: "20px auto",
    width: "80%",
    borderRadius: "10px",
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
  },
  sectionTitle: {
    fontSize: "2em",
    marginBottom: "15px",
  },
  featureList: {
    listStyleType: "none",
    padding: "0",
    fontSize: "1.2em",
    lineHeight: "1.8",
  },
  footer: {
    backgroundColor: "#333",
    color: "white",
    padding: "20px",
    textAlign: "center",
    marginTop: "40px",
  },
};

export default LandingPage;
