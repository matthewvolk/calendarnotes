import React, { useContext, useEffect, useState } from "react";
import UserContext from "../context/UserContext";
import CalendarSelector from "../components/CalendarSelector";
import Events from "../components/Events";

const Dashboard = () => {
  const { userData } = useContext(UserContext);
  const [currentCalendarId, setCurrentCalendarId] = useState(null);
  const [events, setEvents] = useState(null);

  useEffect(() => {
    /**
     * @todo when currentCalendar is updated, write to Mongo with preferred Calendar
     * so I can persist when page reloads
     */

    const getEvents = async (currentCalendarId) => {
      const res = await fetch(
        `/api/google/calendars/${encodeURIComponent(currentCalendarId)}/events`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!data.error) {
        setEvents(data.items.filter((obj) => obj.start));
      }
    };

    if (currentCalendarId) {
      getEvents(currentCalendarId);
    }
  }, [currentCalendarId]);

  const logout = (e) => {
    e.preventDefault();
    window.location.assign("/api/delete/session");
  };

  return (
    <>
      <div>
        <b>
          Welcome, {userData.user.firstName} {userData.user.lastName}
        </b>
        <CalendarSelector setCurrentCalendarId={setCurrentCalendarId} />
      </div>
      <br />
      <button disabled>Login with Wrike</button> |&nbsp;
      <button onClick={logout}>Logout</button>
      <br />
      <br />
      <div>
        <Events events={events} />
      </div>
    </>
  );
};

export default Dashboard;
