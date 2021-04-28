import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import styled from "styled-components";
import { useAuthState } from "../context/Auth";

const StyledButton = styled(Button)`
  margin-right: 0.5rem;

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

const loginWithWrike = (e) => {
  e.preventDefault();
  window.location.assign(process.env.REACT_APP_WRIKE_AUTH_URL);
};

const loginWithGoogleDrive = (e) => {
  e.preventDefault();
  window.location.assign(process.env.REACT_APP_GOOGLE_DRIVE_AUTH_URL);
};

const SettingsModal = ({ close }) => {
  const { user } = useAuthState();
  const [notesStorage, setNotesStorage] = useState({
    current: null,
    available: null,
  });

  useEffect(() => {
    const getNotesStorage = async () => {
      const res = await fetch(`/api/user/notes/storage`, {
        credentials: "include",
      });
      const data = await res.json();
      setNotesStorage(data);
    };

    getNotesStorage();
  }, []);

  const handleNotesLocationChange = async (e) => {
    notesStorage.current = e.target.value;
    console.log("Notes Storage", notesStorage);
    const res = await fetch(`/api/user/notes/storage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notesStorage),
      credentials: "include",
    });
    const data = await res.json();
    setNotesStorage(data);
    // this has to force the folderTree to re-render
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          minWidth: "500px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderBottom: "1px solid black",
            paddingBottom: "15px",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: "0" }}>Settings</h2>
          <StyledButton
            variant="danger"
            onClick={(e) => {
              e.preventDefault();
              close(false);
            }}
          >
            X
          </StyledButton>
        </div>
        <div style={{ margin: "1rem" }}>
          <h5>Current Notes Storage Location:</h5>
          <select
            value={notesStorage?.current ? notesStorage.current : ""}
            onChange={handleNotesLocationChange}
            disabled={notesStorage?.current ? false : true}
            name=""
            id=""
            style={{ minWidth: "150px" }}
          >
            {notesStorage?.available
              ? notesStorage.available.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))
              : null}
          </select>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ margin: "1rem" }}>
            <h5 style={{ fontSize: "1.15rem" }}>
              Connect To Additional Notes Storage Locations:
            </h5>
            {user ? (
              user.googleDrive ? (
                <StyledButton disabled variant="danger">
                  Google Drive
                </StyledButton>
              ) : (
                <StyledButton onClick={loginWithGoogleDrive} variant="danger">
                  Google Drive
                </StyledButton>
              )
            ) : null}
            {user ? (
              user.wrike ? (
                <StyledButton disabled variant="danger">
                  Wrike
                </StyledButton>
              ) : (
                <StyledButton onClick={loginWithWrike} variant="danger">
                  Wrike
                </StyledButton>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
