import React, { useContext, useEffect, useState } from "react";
import UserContext from "./context/UserContext";

const Login = () => {
  const { userData } = useContext(UserContext);

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

const CalendarSelector = () => {
  const [calendars, setCalendars] = useState(null);

  useEffect(() => {
    const getCalendarData = async () => {
      const res = await fetch("/api/google/calendars", {
        credentials: "include",
      });
      const data = await res.json();
      setCalendars(data);
    };
    getCalendarData();
  }, []);

  if (calendars) {
    return (
      <div>
        <b>Calendar:</b>&nbsp;
        <select>
          {calendars.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.summary}
            </option>
          ))}
        </select>
      </div>
    );
  } else {
    return (
      <div>
        <b>Calendars:</b> Loading...
      </div>
    );
  }
};

const Dashboard = () => {
  const { userData } = useContext(UserContext);

  return (
    <>
      <div>
        <b>
          Welcome, {userData.user.firstName} {userData.user.lastName}
        </b>
        <CalendarSelector />
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
