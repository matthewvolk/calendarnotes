import React, { useEffect, useState } from "react";
import { useAuthState } from "../context/Auth";
import CalendarSelector from "../components/CalendarSelector";
import Events from "../components/Events";
import Tree from "../components/Tree";

const Dashboard = () => {
  const { user } = useAuthState();
  const [events, setEvents] = useState(null);
  const [folderTree, setFolderTree] = useState(null);

  const [currentCalendarId, setCurrentCalendarId] = useState(null);
  const [, setCurrentEventId] = useState(null);
  const [wrikeFolderId, setWrikeFolderId] = useState(null);

  useEffect(() => {
    /**
     * @todo when currentCalendar is updated, write to Mongo with preferred Calendar
     * so I can persist when page reloads
     */

    const getEvents = async (currentCalendarId) => {
      const res = await fetch(
        `/api/user/google/calendars/${encodeURIComponent(
          currentCalendarId
        )}/events`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!data.error) {
        let removeCancelledEvents = data.items.filter((obj) => obj.start);
        let eventsOrderedByEarliestFirst = removeCancelledEvents.sort(
          (a, b) => {
            return (
              new Date(a.start.dateTime).getTime() -
              new Date(b.start.dateTime).getTime()
            );
          }
        );
        setEvents(eventsOrderedByEarliestFirst);
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
      `/api/user/notes/create/calendar/${currentCalendarId}/event/${currentEventId}/folder/${wrikeFolderId}`,
      {
        method: "POST",
        credentials: "include",
      }
    );
    const data = await res.json();
    console.log(data);
  };

  const logout = (e) => {
    e.preventDefault();
    window.location.assign(process.env.REACT_APP_LOGOUT_URL);
  };

  const loginWithWrike = (e) => {
    e.preventDefault();
    window.location.assign(process.env.REACT_APP_WRIKE_AUTH_URL);
  };

  useEffect(() => {
    const getTopLevelFoldersForNotesLocation = async () => {
      const res = await fetch(`/api/user/folders`, {
        credentials: "include",
      });
      const data = await res.json();
      // sort alphabetically
      data.sort(function (a, b) {
        let textA = a.name.toUpperCase();
        let textB = b.name.toUpperCase();
        return textA < textB ? -1 : textA > textB ? 1 : 0;
      });
      setFolderTree(data);
    };

    if (user.wrike) {
      if (user.wrike.accessToken) {
        getTopLevelFoldersForNotesLocation();
      }
    }
  }, [user.wrike]);

  const getChildFoldersForNotesLocation = async (clickedFolderId) => {
    const res = await fetch(
      `/api/user/folders?clickedFolderId=${clickedFolderId}`,
      {
        credentials: "include",
      }
    );
    console.log(res);
    if (res.ok) {
      const data = await res.json();

      /**
       * @todo this needs to be changed when I change api/index.js:157
       */
      if (data.error) {
        return data;
      } else {
        // sort data alphabetically
        data.sort(function (a, b) {
          let textA = a.name.toUpperCase();
          let textB = b.name.toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });

        let newFolderTree = [...folderTree];

        function findRecurisvely(tree, id) {
          for (let i = 0; i < tree.length; i++) {
            if (tree[i].id === id) {
              tree[i].childFolders = data;
            } else if (
              tree[i].childFolders &&
              tree[i].childFolders.length &&
              typeof tree[i].childFolders === "object"
            ) {
              findRecurisvely(tree[i].childFolders, id);
            }
          }
        }

        findRecurisvely(newFolderTree, clickedFolderId);
        setFolderTree(newFolderTree);
      }
    } else {
      /** Error handling if res not ok */
    }
  };

  return (
    <>
      <div
        className="container-fluid d-flex flex-column"
        style={{
          position: "absolute",
          top: "0",
          bottom: "0",
          left: "0",
          width: "100vw",
          backgroundColor: "#F0F0F0",
          paddingLeft: "0px",
          paddingRight: "0px",
        }}
      >
        <div
          className="header d-flex pb-2 pt-2 justify-content-between align-items-center"
          style={{
            backgroundColor: "white",
            paddingRight: "15px",
            paddingLeft: "15px",
          }}
        >
          <h3>🗓 CalendarNotes</h3>
          <CalendarSelector setCurrentCalendarId={setCurrentCalendarId} />
          {/* <button disabled class="btn btn-light">
            Settings
          </button> */}
          <div className="d-flex align-items-center">
            <div className="mr-1">Hi, {user.google.firstName}!</div>
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
        <div
          className="body-content d-flex"
          style={{ flexGrow: "1", minHeight: "0" }}
        >
          {user.wrike ? (
            <Tree
              folders={folderTree}
              setFolderTree={setFolderTree}
              getChildFoldersForNotesLocation={getChildFoldersForNotesLocation}
              setWrikeFolderId={setWrikeFolderId}
            />
          ) : (
            <div
              style={{
                lineHeight: "1.5",
                padding: "15px",
                backgroundColor: "white",
                margin: "10px",
                borderRadius: "10px",
              }}
            >
              <h4>Notes Location</h4>
              <p>
                Please{" "}
                <button
                  onClick={loginWithWrike}
                  style={{
                    cursor: "pointer",
                    color: "dodgerblue",
                    textDecoration: "underline",
                    border: "none",
                    backgroundColor: "inherit",
                    padding: "0",
                  }}
                >
                  log in with Wrike
                </button>{" "}
                first!
              </p>
            </div>
          )}
          <div
            style={{
              flexBasis: "80%",
              flexGrow: 1,
              overflow: "auto",
              minHeight: "0",
            }}
          >
            <Events
              events={events}
              setCurrentEventId={setCurrentEventId}
              currentCalendarId={currentCalendarId}
              wrikeFolderId={wrikeFolderId}
              createNotes={createNotes}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
