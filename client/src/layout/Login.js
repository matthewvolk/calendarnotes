import React from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import styled from "styled-components";
import calendarIcon from "../images/calendar-icon.png";

const StyledContainer = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e2473b;
  height: 100vh;
`;

const StyledButton = styled(Button)`
  background-color: ${(props) => {
    if (props.variant === "danger") return "#e2473b";
  }};
  border-color: ${(props) => {
    if (props.variant === "danger") return "#e2473b";
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

const LoginForm = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: white;
  border-radius: 10px;
  padding: 2.75rem 1.75rem;
  min-width: 22.5rem;
`;

const CalendarIcon = styled.img`
  width: 5.95rem;
`;

const TextContainer = styled.div`
  max-width: 250px;
  text-align: center;
`;

const StyledText = styled.p`
  color: #565a5b;
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 2rem;
  margin-bottom: 2.5rem;
`;

const DisclaimerText = styled.p`
  color: #929494;
  font-size: 0.75rem;
  margin: 1.25rem 0 -1rem 0;
`;

const Login = () => {
  const logInWithGoogle = (e) => {
    e.preventDefault();
    window.location.assign(process.env.REACT_APP_GOOGLE_AUTH_URL);
  };

  return (
    <StyledContainer fluid>
      <LoginForm>
        <CalendarIcon src={calendarIcon} alt="Calendar Icon" />
        <TextContainer>
          <StyledText>Please sign in with Google below to proceed</StyledText>
        </TextContainer>
        <StyledButton
          variant="danger"
          size="lg"
          block
          onClick={logInWithGoogle}
        >
          Sign in with Google
        </StyledButton>
        <DisclaimerText>Created by Matthew Volk</DisclaimerText>
      </LoginForm>
    </StyledContainer>
  );
};

export default Login;
