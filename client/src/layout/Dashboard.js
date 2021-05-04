import React, { useState } from "react";
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
  display: grid;
  grid-template-columns: fit-content(100%) 4fr;
  grid-template-rows: fit-content(100%) auto;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 100vw;
  background-color: #e2473b;
  // background-color: #a64030;
  padding-left: 0px;
  padding-right: 0px;
`;

const StyledHeader = styled.div`
  grid-column: 1/3;
  display: flex;
  padding-bottom: 0.35rem;
  padding-top: 0.35rem;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  // background-color: #8a3729;
  padding-right: 15px;
  padding-left: 15px;
`;

const AccountButtonGroup = styled.div`
  display: flex;
  align-items: center;
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

const Dashboard = () => {
  const { user } = useAuthState();
  const [currentCalendarId, setCurrentCalendarId] = useState(null);
  const [, setCurrentEventId] = useState(null);
  const [wrikeFolderId, setWrikeFolderId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notesStorage, setNotesStorage] = useState({
    current: user.notesStorage.current, // can I replace with user.notesStorage.current?
    available: user.notesStorage.available,
  });
  const [eventState, setEventState] = useState({
    loading: false,
    error: null,
    success: null,
    message: null,
    events: null,
  });

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

  return (
    <>
      <StyledDashboardContainer fluid>
        {modalOpen ? (
          <SettingsModal
            isOpen={modalOpen}
            close={setModalOpen}
            notesStorage={notesStorage}
            setNotesStorage={setNotesStorage}
          />
        ) : null}
        <StyledHeader>
          <Logo>
            <CalendarIcon src={calendarIcon} alt="Calendar Icon" />{" "}
            <LogoText>CalendarNotes</LogoText>
          </Logo>
          <CalendarSelector
            eventState={eventState}
            setEventState={setEventState}
            setCurrentCalendarId={setCurrentCalendarId}
          />
          <AccountButtonGroup>
            <div className="mr-1">Hi, {user.google.firstName}!</div>
            <StyledButton variant="danger" onClick={openSettings}>
              Settings
            </StyledButton>
            <LogoutButton variant="danger" onClick={logout}>
              Logout
            </LogoutButton>
          </AccountButtonGroup>
        </StyledHeader>
        <Tree
          notesStorage={notesStorage}
          openSettings={openSettings}
          setWrikeFolderId={setWrikeFolderId}
        />
        <Events
          eventState={eventState}
          setEventState={setEventState}
          setCurrentEventId={setCurrentEventId}
          currentCalendarId={currentCalendarId}
          wrikeFolderId={wrikeFolderId}
          createNotes={createNotes}
        />
      </StyledDashboardContainer>
    </>
  );
};

export default Dashboard;
