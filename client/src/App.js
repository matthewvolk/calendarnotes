import React, { useContext, useEffect, useState } from "react";
import UserContext from "./context/UserContext";
import "./App.css";

const Login = () => {
  const { userData } = useContext(UserContext);

  const logInWithGoogle = (e) => {
    e.preventDefault();
    window.location.assign("/api/google/auth");
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 style={{ fontSize: "5.25rem", marginTop: "0", marginBottom: "0" }}>
          🗓
        </h1>
        <h3 style={{ margin: "1rem 0 1rem 0" }}>CalendarNotes</h3>
        <pre style={{ margin: "0", fontSize: "1.15rem" }}>
          v{userData.version}
        </pre>
        <pre style={{ margin: "0", fontSize: "1.15rem" }}>
          logged_in: {userData.logged_in ? "true" : "false"}
        </pre>
        {userData.logged_in ? (
          <pre style={{ margin: "0", fontSize: "1.15rem" }}>
            user: {userData.user.firstName} {userData.user.lastName}
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
};

const Dashboard = () => {
  const { userData } = useContext(UserContext);
  const [calendars, setCalendars] = useState(null);

  useEffect(() => {
    const getCalendarData = async () => {
      const res = await fetch("/api/google/calendars", {
        credentials: "include",
      });
      const data = await res.json();
      setCalendars(data);

      /**
       * @todo handle server errors
       */
    };
    getCalendarData();
  }, []);

  return (
    <>
      <div>
        <b>
          Welcome, {userData.user.firstName} {userData.user.lastName}
        </b>
      </div>
      <div>
        <b>Calendar:</b>&nbsp;
        <select>
          {calendars ? (
            calendars.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.summary}
              </option>
            ))
          ) : (
            <option value="loading" disabled>
              Loading...
            </option>
          )}
        </select>
      </div>
      <a href="/api/wrike/auth">Login with Wrike</a> |&nbsp;
      <a href="/api/delete/session">Logout</a>
    </>
  );
};

const Authenticate = () => {
  const { userData } = useContext(UserContext);
  let logged_in;
  if (userData.logged_in) {
    logged_in = true;
  } else {
    logged_in = false;
  }

  if (logged_in) {
    return <Dashboard />;
  } else {
    return <Login />;
  }
};

const App = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      const res = await fetch("/api");
      const data = await res.json();
      setUserData(data);

      /**
       * @todo handle server errors
       */
    };
    getUserData();
  }, []);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {console.log(userData)}
      {userData ? <Authenticate /> : <div>Loading...</div>}
    </UserContext.Provider>
  );
};

export default App;
