import React, { useContext } from "react";
import UserContext from "../context/Auth";
import Dashboard from "../layout/Dashboard";
import Login from "../layout/Login";

const Authenticate = () => {
  const { userData } = useContext(UserContext);
  let loggedIn;
  // if (userData) return <Dashboard />
  // else return <Login />
  if (userData.logged_in) {
    loggedIn = true;
  } else {
    loggedIn = false;
  }

  if (loggedIn) {
    return <Dashboard />;
  } else {
    return <Login />;
  }
};

export default Authenticate;
