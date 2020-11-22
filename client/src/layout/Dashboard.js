import React, { useContext } from "react";
import UserContext from "../context/UserContext";
import CalendarSelector from "../components/CalendarSelector";

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

export default Dashboard;
