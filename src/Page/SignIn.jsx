import React, { useRef, useState, useEffect } from "react";
import { initSocket } from "../socket";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "./SignIn.css";

function SignIn({ oldSocketRef }) {
  const socketRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (!email) {
      toast.error("Email is required.");
    }
    if (!password) {
      toast.error("Password is required.");
    } else {
      const data = {
        email: email,
        password: password,
      };
      socketRef.current.emit("sign-in", data);
      const loadingToastId = toast.loading("Signing in...");
       setTimeout(() => {
                  toast.dismiss(loadingToastId);
                }, 5000);
      socketRef.current.on("sign-in-success", ({ token }) => {
        localStorage.setItem("token", token);
        toast.success("Sign In successfully.", { id: loadingToastId });
        navigate("/home", { state: { email: email } });
      });
      socketRef.current.on("sign-in-failed", ({ err }) => {
        toast.error(`Something went wrong\nError : ${err}`);
      });
    }
  }

  return (
    <>
      <div class="login-card">
        <div class="brand">
          <div class="brand-logo"></div>
          <h1>Welcome back</h1>
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

          <div class="remember-forgot">
            <div class="remember-me">
              <input type="checkbox" id="remember" />
              <label for="remember">Remember me</label>
            </div>
            <a href="#" class="forgot-password">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            class="login-btn"
            id="loginButton"
            onClick={handleSubmit}
          >
            Sign in
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

export default SignIn;
