import React from "react";
import { useAuthState } from "./context/Auth";
import Dashboard from "./layout/Dashboard";
import Login from "./layout/Login";

const App = () => {
  const { user } = useAuthState();
  return user ? <Dashboard /> : <Login />;
};

export default App;
