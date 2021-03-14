import React, { useEffect, useState, useRef } from "react";
import { useAuthState } from "../context/Auth";
import CalendarSelector from "../components/CalendarSelector";
import Events from "../components/Events";
import Tree from "../components/Tree";

const Dashboard = () => {
  const { user } = useAuthState();
  const [events, setEvents] = useState(null);
  const [folderTree, setFolderTree] = useState(null);

  const [currentCalendarId, setCurrentCalendarId] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [wrikeFolderId, setWrikeFolderId] = useState(null);

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

  useEffect(() => {
    const getTopLevelFoldersForNotesLocation = async () => {
      const res = await fetch(`/api/folders`, {
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
    getTopLevelFoldersForNotesLocation();
  }, []);

  const getChildFoldersForNotesLocation = async (clickedFolderId) => {
    const res = await fetch(`/api/folders?clickedFolderId=${clickedFolderId}`, {
      credentials: "include",
    });
    const data = await res.json();

    // sort data alphabetically
    data.sort(function (a, b) {
      let textA = a.name.toUpperCase();
      let textB = b.name.toUpperCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });

    let newFolderTree = [...folderTree];

    let clickedFolderInNewFolderTree = newFolderTree.find(
      (folder) => folder.id === clickedFolderId
    );

    if (clickedFolderInNewFolderTree) {
      let clickedFolderInNewFolderTreeIndex = newFolderTree.findIndex(
        (folder) => folder.id === clickedFolderId
      );

      // failing because it's only looking at top-level array nodes, it needs to traverse the entire array tree
      newFolderTree[clickedFolderInNewFolderTreeIndex].childFolders = data;
      setFolderTree(newFolderTree);
    } else {
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
        <br />
        <div className="d-flex">
          <Tree
            folders={folderTree}
            setFolderTree={setFolderTree}
            getChildFoldersForNotesLocation={getChildFoldersForNotesLocation}
            setWrikeFolderId={setWrikeFolderId}
          />
          <div style={{ width: "90%" }}>
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
