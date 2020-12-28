import React from "react";

const Login = () => {
  const logInWithGoogle = (e) => {
    e.preventDefault();
    window.location.assign("/api/google/auth");
  };

  return (
    <div className="Login-frame">
      <div className="Login">
        <div className="Login-box">
          <h1 className="calendar-emoji">🗓</h1>
          <h3 className="calendar-header">CalendarNotes</h3>
          <div className="button-frame">
            <button
              onClick={logInWithGoogle}
              type="button"
              className="login-with-google-btn"
            >
              Sign in with Google
            </button>
          </div>
          <div className="Login-box-info">
            <pre className="Login-box-info-text">version: 0.0.1 alpha</pre>
            <pre className="Login-box-info-text">by: Matthew Volk</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
