import React, { useRef, useState, useEffect } from "react";
import { initSocket } from "../socket";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "./SignIn.css";

function Forget({ oldSocketRef }) {
  const socketRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const[otp, setOtp] = useState('')
  const [otpSend, setOtpSend] = useState(false);
  const [verified, setVerified] = useState(false);
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
    if (!oldSocketRef) init();
    else {
      socketRef.current = oldSocketRef.current;
    }
    if (socketRef.current) {
      const email = localStorage.getItem("email");
      const password = localStorage.getItem("password");
      const data = { email: email, password: password };
      socketRef.current.emit("sign-up", data);
      socketRef.current.on("sign-up-success", () => {
        navigate("/home", { state: { email: email } });
      });
    }
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [socketRef]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!otpSend) {
      if (!email) toast.error("Enter your email.");
      else {
        const toastId = toast.loading("Sending OTP...");
        socketRef.current.emit("send-otp", { email });
        socketRef.current.on("otp-sent", () => {
          toast.success("OTP sent to your email.", { id: toastId });
          setOtpSend(true);
        });
      }
    } else if (!verified) {
      if (!otp) {
        toast.error("Enter OTP to verify.");
      } else {
        const data = { email: email, otp: otp };
        socketRef.current.emit("verify-otp", data);
        const toastId = toast.loading("Verifying...");
        socketRef.current.on("otp-verified", () => {
          toast.success("OTP verified successfully.", { id: toastId });
          setVerified(true);
        });
        socketRef.current.on("invalid-otp", () => {
          toast.error("OTP verified Failed.", { id: toastId });
        });
      }
    }
    else{
        if(!password) toast.error("Enter your password.");
        const id = toast.loading("Updating your password...")
        socketRef.current.emit("update-password",{
            email,password
        })
        socketRef.current.on("password-updated", () => {
            toast.success("Password updated successfully.", { id: id });
        })
    }
  }

  return (
    <>
      <div class="login-card">
        <div class="brand">
          <div class="brand-logo"></div>
          <h1>Forget Password</h1>
          <p>Enter your credentials to access your account</p>
        </div>

        <form id="loginForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              autocomplete="email"
              required
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
            <div class="error" id="emailError"></div>
          </div>

          {!verified && otpSend && (
            <div class="form-group">
              <label for="password">OTP</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                onChange={(e) => {
                  setOtp(e.target.value);
                }}
              />
              <div class="error" id="passwordError"></div>
            </div>
          )}
           {verified && (
            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
              <div class="error" id="passwordError"></div>
            </div>
          )}
          <button
            type="submit"
            class="login-btn"
            id="loginButton"
            onClick={handleSubmit}
          >
            {verified ? "Update Password" : otpSend ? "Verify otp" : "Send otp"}
          </button>
        </form>

        <div class="signup-link">
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </>
  );
}

export default Forget;
