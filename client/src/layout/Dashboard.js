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

  return (
    <>
      <div>
        <b>
          Welcome, {userData.user.firstName} {userData.user.lastName}
        </b>
        <CalendarSelector setCurrentCalendarId={setCurrentCalendarId} />
      </div>
      <div>
        <Events events={events} />
      </div>
      <a href="/api/wrike/auth">Login with Wrike</a> |&nbsp;
      <a href="/api/delete/session">Logout</a>
    </>
  );
};

export default Dashboard;
