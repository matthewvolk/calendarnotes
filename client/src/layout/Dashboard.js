import React, { useEffect, useState } from "react";
import { useAuthState } from "../context/Auth";
import CalendarSelector from "../components/CalendarSelector";
import Events from "../components/Events";
import Tree from "../components/Tree";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import styled from "styled-components";

const StyledDashboardContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100vw;
  background-color: #f0f0f0;
  padding-left: 0px;
  padding-right: 0px;
`;

const LogoutButton = styled(Button)`
  margin-left: 0.25rem;
`;

const StyledHeader = styled.div`
  display: flex;
  padding-bottom: 0.65rem;
  padding-top: 0.65rem;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  padding-right: 15px;
  padding-left: 15px;
`;

const AccountButtonGroup = styled.div`
  display: flex;
  align-items: center;
`;

const StyledBody = styled.div`
  display: flex;
  flex-grow: 1;
  min-height: 0;
`;

const EventsContainer = styled.div`
  flex-basis: 80%;
  flex-grow: 1;
  overflow: auto;
  min-height: 0;
`;

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
      <StyledDashboardContainer fluid>
        <StyledHeader>
          <h3>🗓 CalendarNotes</h3>
          <CalendarSelector setCurrentCalendarId={setCurrentCalendarId} />
          {/* <button disabled class="btn btn-light">
            Settings
          </button> */}
          <AccountButtonGroup>
            <div className="mr-1">Hi, {user.google.firstName}!</div>
            {user.wrike ? (
              user.wrike.accessToken ? (
                <Button variant="secondary" disabled>
                  Login with Wrike
                </Button>
              ) : (
                <Button variant="secondary" onClick={loginWithWrike}>
                  Login with Wrike
                </Button>
              )
            ) : (
              <Button variant="secondary" onClick={loginWithWrike}>
                Login with Wrike
              </Button>
            )}
            <LogoutButton variant="secondary" onClick={logout}>
              Logout
            </LogoutButton>
          </AccountButtonGroup>
        </StyledHeader>
        <StyledBody>
          <Tree
            folders={folderTree}
            setFolderTree={setFolderTree}
            getChildFoldersForNotesLocation={getChildFoldersForNotesLocation}
            setWrikeFolderId={setWrikeFolderId}
          />
          <Events
            events={events}
            setCurrentEventId={setCurrentEventId}
            currentCalendarId={currentCalendarId}
            wrikeFolderId={wrikeFolderId}
            createNotes={createNotes}
          />
        </StyledBody>
      </StyledDashboardContainer>
    </>
  );
};

export default Dashboard;
