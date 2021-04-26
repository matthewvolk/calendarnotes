import React, { useEffect, useState } from "react";
import { useAuthState } from "../context/Auth";
import CalendarSelector from "../components/CalendarSelector";
import Events from "../components/Events";
import Tree from "../components/Tree";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import calendarIcon from "../images/calendar-icon.png";
import styled from "styled-components";
import SettingsModal from "../components/SettingsModal";

const StyledDashboardContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100vw;
  background-color: #e2473b;
  padding-left: 0px;
  padding-right: 0px;
`;

const LogoutButton = styled(Button)`
  margin-left: 0.25rem;

  background-color: ${(props) => {
    if (props.variant === "danger") return "#e2473b";
    if (props.disabled) return "#f3b5b0";
  }};
  border-color: ${(props) => {
    if (props.variant === "danger") return "#e2473b";
    if (props.disabled) return "#f3b5b0";
  }};

  &:hover {
    background-color: ${(props) => {
      if (props.variant === "danger") return "#B7362C";
    }};
    border-color: ${(props) => {
      if (props.variant === "danger") return "#B7362C";
    }};
  }
`;

const StyledHeader = styled.div`
  display: flex;
  padding-bottom: 0.35rem;
  padding-top: 0.35rem;
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

const CalendarIcon = styled.img`
  width: 2.5rem;
  height: 100%;
`;

const Logo = styled.div`
  display: flex;
  align-content: center;
`;

const LogoText = styled.h3`
  margin-bottom: 0;
  margin-top: 3px;
`;

const StyledButton = styled(Button)`
  background-color: ${(props) => {
    if (props.variant === "danger") return "#e2473b";
    if (props.disabled) return "#f3b5b0";
  }};
  border-color: ${(props) => {
    if (props.variant === "danger") return "#e2473b";
    if (props.disabled) return "#f3b5b0";
  }};

  &:hover {
    background-color: ${(props) => {
      if (props.variant === "danger") return "#B7362C";
    }};
    border-color: ${(props) => {
      if (props.variant === "danger") return "#B7362C";
    }};
  }

  &:disabled {
    background-color: ${(props) => {
      if (props.disabled) return "#e76b62";
    }};
    border-color: ${(props) => {
      if (props.disabled) return "#e76b62";
    }};
    cursor: not-allowed;
  }
`;

const Dashboard = () => {
  const { user } = useAuthState();
  const [currentCalendarId, setCurrentCalendarId] = useState(null);
  const [events, setEvents] = useState(null);
  const [, setCurrentEventId] = useState(null);
  const [folderTree, setFolderTree] = useState(null);
  const [wrikeFolderId, setWrikeFolderId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const getEvents = async (currentCalendarId) => {
      const res = await fetch(
        `/api/user/google/calendars/${encodeURIComponent(
          currentCalendarId
        )}/events`,
        {
          credentials: "include",
        }
      );
      const calendarEvents = await res.json();
      if (res.ok) {
        setEvents(calendarEvents);
      } else {
        console.error("ERROR at getEvents()", res);
      }
    };

    if (currentCalendarId) {
      getEvents(currentCalendarId);
    }
  }, [currentCalendarId]);

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

  const openSettings = (e) => {
    e.preventDefault();
    setModalOpen(true);
  };

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

  const listGoogleDrives = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/user/google/drives`, {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();
    console.log(data);
  };

  return (
    <>
      <StyledDashboardContainer fluid>
        {modalOpen ? (
          <SettingsModal isOpen={modalOpen} close={setModalOpen} />
        ) : null}
        <StyledHeader>
          <Logo>
            <CalendarIcon src={calendarIcon} alt="Calendar Icon" />{" "}
            <LogoText>CalendarNotes</LogoText>
          </Logo>
          <CalendarSelector setCurrentCalendarId={setCurrentCalendarId} />
          <AccountButtonGroup>
            {user ? (
              user.googleDrive ? (
                <button onClick={listGoogleDrives}>Drives</button>
              ) : (
                <button disabled>Drives</button>
              )
            ) : null}
            <div className="mr-1">Hi, {user.google.firstName}!</div>
            <StyledButton variant="danger" onClick={openSettings}>
              Settings
            </StyledButton>
            <LogoutButton variant="danger" onClick={logout}>
              Logout
            </LogoutButton>
          </AccountButtonGroup>
        </StyledHeader>
        <StyledBody>
          <Tree
            openSettings={openSettings}
            folders={folderTree}
            setFolderTree={setFolderTree}
            getChildFoldersForNotesLocation={getChildFoldersForNotesLocation}
            setWrikeFolderId={setWrikeFolderId}
          />
          <Events
            events={events}
            setEvents={setEvents}
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
