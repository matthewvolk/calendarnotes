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
  return (
    <>
      <div>
        Welcome, {userData.user.firstName} {userData.user.lastName}
      </div>
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

/**
 * @notes
 * - UserContext isn't important yet, but it will be when I have many components, it'll be the source of truth for user data throughout the app
 * - I don't need client side routing, because the entire app functions on the premise of the user being logged out or logged in
 * - UserContext checks to see if there is a user logged in, and if there is, the <Home /> component is conditionally rendered
 * - Either rendered as a login screen or rendered as the app itself, all based on whether or not a user is logged in.
 * @nextsteps
 * - I need to move the useEffect hook from <Home /> and into <App />, then refactor <Home /> to use the context from the UserContext
 * - <App /> will then show either "Loading..." while it fetches data, or it will render the <Home /> component
 * - The <Home /> component will then check the user context and either render the <Authenticated /> app or the <Unauthenticated /> app
 * - The "Loading..." part is going to be hard because useEffect can't be used as the "isLoading ? <div>Loading...</div> : <Home />"
 */
