import React, { useEffect, useState } from "react";
import { useAuthState } from "../context/Auth";
import CalendarSelector from "../components/CalendarSelector";
import Events from "../components/Events";
import NotesLocation from "../components/NotesLocation";

const Dashboard = () => {
  const { user } = useAuthState();
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
      <div className="container-fluid">
        <h3 className="text-center mt-3">
          Welcome, {user.google.firstName} {user.google.lastName}!
        </h3>
        <div className="d-flex justify-content-between">
          <div className="d-flex">
            <CalendarSelector setCurrentCalendarId={setCurrentCalendarId} />
          </div>
          {/* <button disabled class="btn btn-light">
            Settings
          </button> */}
          <div>
            {user.wrike ? (
              user.wrike.accessToken ? (
                <button className="btn btn-secondary" disabled>
                  Login with Wrike
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={loginWithWrike}>
                  Login with Wrike
                </button>
              )
            ) : (
              <button className="btn btn-secondary" onClick={loginWithWrike}>
                Login with Wrike
              </button>
            )}
            <button className="btn btn-secondary ml-1" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
        <div className="mt-4">
          <NotesLocation setWrikeFolderId={setWrikeFolderId} />
        </div>
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
      </div>
    </>
  );
};

export default Dashboard;
