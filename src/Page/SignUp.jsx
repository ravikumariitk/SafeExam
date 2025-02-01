import React, { useRef, useState, useEffect } from "react";
import { initSocket } from "../socket";
import { useNavigate } from "react-router-dom";
import "./SignIn.css";

import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

function SignUp() {
  const socketRef = useRef(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roll, setRoll] = useState("null");
  const [role, setRole] = useState("Instructor");
  const [otp,setOtp] = useState('')
  const [verified , setVerified] = useState(false)
  const [otpSend, setOtpSend] = useState(false)
  const navigate = useNavigate();
  useEffect(() => {
    async function init() {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        alert("Connection failed. Try again later.");
      }
    }
    init();

    if (socketRef.current) {
      const email = localStorage.getItem("email");
      const password = localStorage.getItem("password");
      const data = { email: email, password: password };
      socketRef.current.emit("sign-up", data);
      const loadingToastId = toast.loading("Signing up...");
       setTimeout(() => {
                  toast.dismiss(loadingToastId);
                }, 5000);
      socketRef.current.on("sign-up-success", () => {
        toast.success("Signed Up successfully.", { id: loadingToastId });
        navigate("/home", { state: { email: email } });
      });
    }
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [socketRef]);

  function handleSubmit(e) {
    if(! verified && !otpSend){
      e.preventDefault();
      if(!email) toast.error("Enter email to verify.");
      else{
      const toastId = toast.loading("Sending OTP...")
      socketRef.current.emit('send-otp',{email})
      socketRef.current.on('otp-sent',()=>{
        toast.success('OTP sent to your email.',{id:toastId});
        setOtpSend(true);
      })
    }
  }
    else if(!verified){
      e.preventDefault();
      if(!otp) {
        toast.error("Enter OTP to verify.");
      }
      else{
        const data = { email: email, otp: otp };
        socketRef.current.emit("verify-otp", data);
        const toastId = toast.loading("Verifying...")
        socketRef.current.on("otp-verified", () => {
          toast.success("OTP verified successfully.", { id: toastId });
          setVerified(true);
        })
        socketRef.current.on("invalid-otp", () => {
          toast.error("OTP verified Failed.", { id: toastId });
        })
      }
    }
    else{
    e.preventDefault();
    if ((!name && !email) || !password) {
      toast.error("Please fill all the fields");
    } else if (role === "Student" && !roll) {
      toast.error("Roll No. is required");
    } else {
      const data = {
        name: name,
        email: email,
        password: password,
        roll: roll,
        role: role,
      };
      socketRef.current.emit("sign-up", data);
      socketRef.current.on("sign-up-success", () => {
        localStorage.setItem("email", email);
        localStorage.setItem("password", password);
        toast.success("Successfully created your account.");
        navigate("/home", { state: { email: email } });
      });
      socketRef.current.on("sign-up-failed", ({ err }) => {
        toast.error(`Something went wrong\nError : ${err}`);
      });
    }
  }
}
  return (
    <>
      <div class="login-card">
        <div class="brand">
          <div class="brand-logo"></div>
          <h1>Create Account</h1>
          <p>Enter your information to create your account</p>
        </div>

        <form id="loginForm">
          <div class="form-group">
            <label for="name">Name</label>
            <input
              type="text"
              id="email"
              placeholder="John Due"
              // autocomplete="email"
              required
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
            <div class="error" id="emailError"></div>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              autoComplete="email"
              required
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <div class="error" id="emailError"></div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
            <div class="error" id="passwordError"></div>
          </div>
          <select class="select" onChange={(e) => setRole(e.target.value)}>
            <option value="Instructor">Instructor</option>
            <option value="Student">Student</option>
          </select>
          {role === "Student" && (
            <>
              <br />
              <input
                class="roll"
                type="text"
                placeholder="Enter your roll no."
                onChange={(e) => setRoll(e.target.value)}
              />
              <br />
            </>
          )}
          
          { otpSend && <div class="form-group">
          <label for="email">OTP</label>
            <input
              type="email"
              id="email"
              placeholder=""
              autoComplete="email"
              required
              onChange={(e) => {
                setOtp(e.target.value);
              }}
            />
          </div>}

          <button
            type="submit"
            class="login-btn"
            id="loginButton"
            onClick={handleSubmit}
          >
            {verified ? "Sign Up" : (otpSend? "Verify otp": "Send otp")}
          </button>
        </form>

        <div class="signup-link">
          <p>
            Already have an account? <Link to="/signin">Sign In</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default SignUp;
