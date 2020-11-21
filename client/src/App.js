import React, { useEffect, useState } from "react";
import UserContext from "./context/UserContext";
import "./App.css";

const Home = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const res = await fetch("/api");
      const appData = await res.json();
      setData(appData);
    };
    getData();
  }, []);

  const logInWithGoogle = (e) => {
    e.preventDefault();
    window.location.assign("/api/google/auth");
  };

  if (data) {
    return (
      <div className="App">
        <header className="App-header">
          <h1
            style={{ fontSize: "5.25rem", marginTop: "0", marginBottom: "0" }}
          >
            🗓
          </h1>
          <h3 style={{ margin: "1rem 0 1rem 0" }}>CalendarNotes</h3>
          <pre style={{ margin: "0", fontSize: "1.15rem" }}>
            v{data.version}
          </pre>
          <pre style={{ margin: "0", fontSize: "1.15rem" }}>
            logged_in: {data.logged_in ? "true" : "false"}
          </pre>
          {data.logged_in ? (
            <pre style={{ margin: "0", fontSize: "1.15rem" }}>
              user: {data.user.firstName} {data.user.lastName}
            </pre>
          ) : null}
          <button
            onClick={logInWithGoogle}
            type="button"
            className="login-with-google-btn"
          >
            Sign in with Google
          </button>
        </header>
      </div>
    );
  } else {
    return (
      <div className="App">
        <header className="App-header">
          <h1
            style={{ fontSize: "5.25rem", marginTop: "0", marginBottom: "0" }}
          >
            🗓
          </h1>
          <h3 style={{ margin: "1rem 0 1rem 0" }}>CalendarNotes</h3>
          <pre style={{ margin: "0", fontSize: "1.15rem" }}>Loading...</pre>
        </header>
      </div>
    );
  }
};

const App = () => {
  const [userData, setUserData] = useState({
    user: null,
  });

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      <Home />
    </UserContext.Provider>
  );
};

export default App;
