import fs from 'fs';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import axios from 'axios';

async function extractTextFromPdf(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
  } catch (error) {
    console.error(`Error extracting text from PDF: ${error}`);
    return "";
  }
}

function extractTextFromImage(imagePath) {
  return new Promise((resolve, reject) => {
    Tesseract.recognize(imagePath, 'eng', {
      logger: (m) => console.log(m),
    }).then(({ data: { text } }) => resolve(text))
      .catch((error) => {
        console.error(`Error extracting text from image: ${error}`);
        reject(error);
      });
  });
}

async function getAIResponse(text, numQuestions, questionType) {
  const message = `Generate ${numQuestions} ${questionType} questions from the following text:\n${text}`;
  try {
    const apiRequestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: message,
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

    const aiMessage = response.data.candidates[0].content.parts[0].text
      .replace(/(?:\*\*([^*]+)\*\*)/g, '<b>$1</b>') // Convert **bold** to <b> tags
      .replace(/(?:\*([^*]+)\*)/g, '<i>$1</i>') // Convert *italic* to <i> tags
      .replace(/\n/g, '<br>');;

    return aiMessage;
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
}

async function main() {
  const inputFiles = ["./AI/Test.pdf"];  // Example files
  const numQuestions = 5;
  const questionType = "MCQ";  // or "Subjective"
  
  let fullText = "";

  for (const file of inputFiles) {
    if (file.endsWith(".pdf")) {
      fullText += await extractTextFromPdf(file) + "\n";
    } else if (file.match(/\.(jpg|jpeg|png)$/)) {
      fullText += await extractTextFromImage(file) + "\n";
    }
  }
  
  if (fullText.trim()) {
    const questions = await getAIResponse(fullText, numQuestions, questionType);
    console.log("Generated Questions:\n", questions);
  } else {
    console.log("No text extracted from files.");
  }
}

main().catch((err) => console.error("Error:", err));
