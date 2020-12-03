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

    /**
     * @todo figure out refresh tokens
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
        let removeCancelledEvents = data.items.filter((obj) => obj.start);
        let orderByEarliestFirst = removeCancelledEvents.sort((a, b) => {
          return (
            new Date(a.start.dateTime).getTime() -
            new Date(b.start.dateTime).getTime()
          );
        });
        setEvents(orderByEarliestFirst);
      } else {
        console.error("ERROR at getEvents()", data);
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

  const loginWithWrike = (e) => {
    e.preventDefault();
    window.location.assign("/api/wrike/auth");
  };

  return (
    <>
      <div>
        <h3>
          Welcome, {userData.user.firstName} {userData.user.lastName}
        </h3>
        <CalendarSelector setCurrentCalendarId={setCurrentCalendarId} />
      </div>
      <br />
      {userData.user.wrikeAccessToken ? (
        <button disabled>Login with Wrike</button>
      ) : (
        <button onClick={loginWithWrike}>Login with Wrike</button>
      )}
      <button onClick={logout}>Logout</button>
      <br />
      {userData.user.wrikeAccessToken ? (
        <div>
          <b>Choose Wrike Space:</b>&nbsp;
          <select disabled>
            <option>N/A</option>
          </select>
        </div>
      ) : null}
      <br />
      <div>
        <Events events={events} />
      </div>
    </>
  );
};

export default Dashboard;
