import React, { useContext } from "react";
import UserContext from "../context/UserContext";
import Dashboard from "../layout/Dashboard";
import Login from "../layout/Login";

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

export default Authenticate;
