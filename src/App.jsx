import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import QuizForm from './Page/Quiz'
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './Page/Home'
// import QuizForm from './Page/Quiz'
import TakeQuiz from './Page/TakeQuiz'
import AnsKey from './Page/AnsKey'
import PersonalResult from './Page/PersonalResult'
import ClassResult from './Page/ClassResult'
import Response from './Page/Response'
import ReleaseResult from './Page/ReleaseResult'
import SignUp from './Page/SignUp'
import SignIn from './Page/SignIn'
import GetAnsKey from './Page/GetAnsKey'
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
     <div>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        success: {
                            theme: {
                                primary: '#4aed88',
                            },
                        },
                    }}
                ></Toaster>
            </div>
      <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />}/>
        <Route path="createquiz/:email" element={<QuizForm />} />
        <Route path="takequiz/:email" element={<TakeQuiz />} />
        <Route path="anskey" element={<AnsKey />} />
        <Route path="getanskey" element={<GetAnsKey />} />
        <Route path="result" element={<PersonalResult />} />
        <Route path="classresult" element={<ClassResult />} />
        <Route path="response" element={<Response />} />
        <Route path="release" element={<ReleaseResult />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="signin" element={<SignIn />} />


      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
