import React, { useContext, useEffect, useState } from "react";
import UserContext from "../context/UserContext";
import CalendarSelector from "../components/CalendarSelector";
import Events from "../components/Events";
import NotesLocation from "../components/NotesLocation";

const Dashboard = () => {
  const { userData } = useContext(UserContext);
  const [events, setEvents] = useState(null);

  const [currentCalendarId, setCurrentCalendarId] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [wrikeFolderId, setWrikeFolderId] = useState(null);

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

  const createNotes = async (
    /**
     * @todo
     * 1. Handle events without attendees
     */
    currentEventId,
    currentCalendarId,
    wrikeFolderId
  ) => {
    const res = await fetch(
      `/api/notes/create/calendar/${currentCalendarId}/event/${currentEventId}/folder/${wrikeFolderId}`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    const data = await res.json();
    console.log(data);
  };

  useEffect(() => {
    const logWrikeFolderId = (wrikeFolderId) => {
      console.log("From <Dashboard />'s logWrikeFolderId()", wrikeFolderId);
    };

    if (wrikeFolderId) {
      logWrikeFolderId(wrikeFolderId);
    }
  }, [wrikeFolderId]);

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
      <NotesLocation setWrikeFolderId={setWrikeFolderId} />
      <br />
      <div>
        <Events
          events={events}
          setCurrentEventId={setCurrentEventId}
          currentCalendarId={currentCalendarId}
          wrikeFolderId={wrikeFolderId}
          createNotes={createNotes}
        />
      </div>
    </>
  );
};

export default Dashboard;
