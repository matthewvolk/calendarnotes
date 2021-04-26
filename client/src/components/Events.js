import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import styled from "styled-components";

const EventsWrapper = styled.div`
  padding: 15px;
  margin: 10px 10px 10px 0px;
  background-color: white;
  border-radius: 10px;
  flex-grow: 7;
  flex-basis: auto;
  overflow: auto;
`;

const EventsHeader = styled.div`
  display: flex;
  align-items: baseline;
`;

const Arrow = styled.div`
  cursor: pointer;
  padding: 0.5rem;
`;

const TodayButton = styled.button`
  cursor: pointer;
  margin: 0 0.5rem 0 1rem;
`;

const WeekOf = styled.h5`
  font-weight: 400;
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

const Events = ({
  events,
  setEvents,
  setCurrentEventId,
  currentCalendarId,
  wrikeFolderId,
  createNotes,
}) => {
  const nextWeek = async () => {
    const response = await fetch(
      `/api/user/google/calendars/${currentCalendarId}/events?weekOf=${events.startOfWeekISO}&prevOrNext=next`
    );
    const calendarEvents = await response.json();
    if (response.ok) {
      setEvents(calendarEvents);
    } else {
      console.error("ERROR at getEvents()", response);
    }
  };
  const prevWeek = async () => {
    const response = await fetch(
      `/api/user/google/calendars/${currentCalendarId}/events?weekOf=${events.startOfWeekISO}&prevOrNext=prev`
    );
    const calendarEvents = await response.json();
    if (response.ok) {
      setEvents(calendarEvents);
    } else {
      console.error("ERROR at getEvents()", response);
    }
  };
  const goToToday = async () => {
    const response = await fetch(
      `/api/user/google/calendars/${currentCalendarId}/events`
    );
    const calendarEvents = await response.json();
    if (response.ok) {
      setEvents(calendarEvents);
    } else {
      console.error("ERROR at getEvents()", response);
    }
  };

  if (events) {
    return (
      <EventsWrapper>
        <EventsHeader>
          <h4>Events</h4>
          <TodayButton onClick={goToToday}>Today</TodayButton>
          <Arrow onClick={prevWeek}>&lang;</Arrow>
          <WeekOf>Week of {events.startOfWeek}</WeekOf>
          <Arrow onClick={nextWeek}>&rang;</Arrow>
        </EventsHeader>
        <Table responsive striped bordered hover size="sm">
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Date/Time</th>
              <th scope="col">Create Notes</th>
            </tr>
          </thead>
          <tbody>
            {events.events.map((event) => {
              return (
                <tr key={event.id}>
                  <td style={{ width: "35%" }}>{event.summary}</td>
                  <td>
                    {new Intl.DateTimeFormat("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    }).format(
                      Date.parse(event.start.dateTime || event.start.date)
                    )}{" "}
                    -{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                    }).format(Date.parse(event.end.dateTime || event.end.date))}
                  </td>
                  <td>
                    {currentCalendarId && wrikeFolderId ? (
                      <StyledButton
                        variant="danger"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentEventId(event.id);
                          createNotes(
                            event.id,
                            currentCalendarId,
                            wrikeFolderId
                          );
                        }}
                      >
                        Create Meeting Notes
                      </StyledButton>
                    ) : (
                      <StyledButton variant="danger" disabled>
                        Select "Notes Location" First
                      </StyledButton>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </EventsWrapper>
    );
  } else {
    return (
      <EventsWrapper>
        <h4>Events This Week</h4>
        <p>
          Either you haven't selected a calendar above, or you do not have
          permission to consume the events for the calendar you have chosen
        </p>
      </EventsWrapper>
    );
  }
};

export default Events;
