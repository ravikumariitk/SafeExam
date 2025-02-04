import React, { useState } from 'react';
import pdfToText from 'react-pdftotext';
import axios from 'axios';
import toast from 'react-hot-toast'
function Generator({questions, setQuestions}) {
  const [text, setText] = useState("");
  const [aiResponse, setAiResponse] = useState([]);
  const [correctMarks, setCorrectMarks] = useState(0)
  const [incorrectMarks, setInCorrectMarks] = useState(0)
  const [partialMarks, setPartialMarks] = useState(0)
  const [time,setTime] = useState(0);
  const [mcq,setMcq] = useState(0);
  const[sub, setSub] = useState(0);
  async function getAIResponse(text) {
    const message = `Based on the following text : ${text} generate ${mcq} MCQ with multiple correct with options and ${sub} subjective questions. return me an array of object of type { [ type : "mcq" or "subjective" question : "" , options : [ {text : "" , correct :"" } ] ] }`;
    try {
      const apiRequestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: ` ${message} `,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
          responseMimeType: "text/plain",
        },
      };
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyCl28D4MIbcC-KnnEakRg7linO6K5OzMiE",
        apiRequestBody,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      let aiMessage = response.data.candidates[0].content.parts[0].text;
      aiMessage = aiMessage.replace("```json", "");
      aiMessage = aiMessage.replace("```", "");
      aiMessage = JSON.parse(aiMessage)
      console.log(aiMessage)
      return aiMessage
    } catch (error) {
      console.error("Error fetching AI response:", error);
      return "Sorry, I encountered an error while processing your request.";
    }
  }

  const handleFileChange = (e) => {
    const id = toast.loading("Generating Questions based on your file...");
    function extractText(event) {
      const file = event.target.files[0];
      pdfToText(file)
        .then((text) => {
          setText(text);
          getAIResponse(text).then((response) => {
            setAiResponse(response)
            toast.success("Questions Successfully Generated.",{id:id})
        });
        })
        .catch((error) => {console.error("Failed to extract text from pdf")
            toast.error("Something went wrong! please try again.",{id:id});
        });
    }
    extractText(e);
  };

  const addQuestions = (item) => {
    const id = toast.loading("Adding...")
    console.log(item);
    const newQuestion = {
        type: "multiple-choice",
        statement: "",
        options: [],
        time: time,
        correctMarks: correctMarks,
        incorrectMarks : incorrectMarks,
        partialMarks : partialMarks
    }
    newQuestion.statement = item.question
    if(item.type === 'subjective'){
        newQuestion.type = 'subjective'
    }
    if(item.type === 'mcq'){
        item.options.forEach((opt)=>{
            newQuestion.options.push(opt.text)
        })
    }
    setQuestions([...questions, newQuestion]);
    toast.success("Added Successfully", {id:id})
  }

  const renderMCQs = (mcq) => {
    return (
      <div key={mcq.question} style={styles.questionItem}>
        <div style = {styles.questionHeader}>
        <h4>{mcq.question}</h4>
        </div>
        <ul>
          {mcq.options.map((option, index) => (
            <li key={index} style={styles.optionsList} >
              <label>
                <input style={styles.optionItem} type="checkbox" disabled checked={option.correct} />
                {option.text}
              </label>
            </li>
          ))}
        </ul>
           <span> Time : <input style={styles.input} type="number" onChange={(e)=>{setTime(e.target.value)}}  /> seconds &nbsp; &nbsp; &nbsp;
            Correct Marks : <input style={styles.input} type="number" onChange={(e)=>{setCorrectMarks(e.target.value)}}  />&nbsp; &nbsp; &nbsp;
            Incorrect Marks : <input style={styles.input} type="number" onChange={(e)=>{setInCorrectMarks(e.target.value)}}  />&nbsp; &nbsp; &nbsp;
            Partially correct Marks : <input style={styles.input} type="number" onChange={(e)=>{setPartialMarks(e.target.value)}}  /> </span>
      </div>
    );
  };

  const renderSubjective = (subjective) => {
    return (
      <div key={subjective.question}>
        <h4>{subjective.question}</h4>
        {/* <textarea rows="4" cols="50" placeholder="Your answer here..." /> */}
        <span> Time : <input style={styles.input} type="number" onChange={(e)=>{setTime(e.target.value)}}  /> seconds
            Correct Marks : <input style={styles.input} type="number" onChange={(e)=>{setCorrectMarks(e.target.value)}}  />
            Incorrect Marks : <input style={styles.input} type="number" onChange={(e)=>{setInCorrectMarks(e.target.value)}}  />
            Partially correct Marks : <input style={styles.input} type="number" onChange={(e)=>{setPartialMarks(e.target.value)}}  /> </span>
      </div>

    );
  };

  return (
    <div style={styles.container}>
      <h2>Upload PDF </h2>
      No. of multiple choice questions : <input type="number" onChange={(e)=>setMcq(e.target.value)}  /> &nbsp; &nbsp;
      No. of Subjective questions: <input type="number" onChange={(e)=>setSub(e.target.value)}  />&nbsp; &nbsp;
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {/* <button onclick={()=>{generate}} style={styles.Button} >Generate</button> */}
      {aiResponse.length > 0 && (
        <div>
          <h3>AI Generated Questions:</h3>
          {aiResponse.map((item, index) =>
            <div style={styles.container}>
            
            <button style={styles.addButton} onClick={()=>addQuestions(item)} >Add this questions</button>
            {item.type === "mcq" ? renderMCQs(item) : renderSubjective(item)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    margin: "20px auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
  },
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
  addButton: {
    padding: "10px 20px",
    backgroundColor: "black",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1rem",
    float: "right", // Align the button to the right
  },
  Button: {
    padding: "5px 10px",
    backgroundColor: "black",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1rem",
     // Align the button to the right
  },
  input : {
    width : '100px'
  }
};

export default Generator;
