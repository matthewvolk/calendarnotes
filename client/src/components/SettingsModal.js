import Button from "react-bootstrap/Button";
import styled from "styled-components";
import { useAuthState } from "../context/Auth";

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
          padding: "10px",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ alignSelf: "flex-end" }}>
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
        <h2 style={{ textAlign: "center" }}>Settings</h2>
        {user ? (
          user.wrike ? (
            <div style={{ textAlign: "center" }}>Signed in with: Wrike</div>
          ) : (
            <div style={{ textAlign: "center" }}>Signed in with: </div>
          )
        ) : null}
        <div style={{ padding: "50px", display: "flex" }}>
          <h5>Notes Location:</h5> &nbsp;
          <StyledButton onClick={loginWithGoogleDrive} variant="danger">
            Google Drive
          </StyledButton>{" "}
          &nbsp;
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
  );
};

export default SettingsModal;
