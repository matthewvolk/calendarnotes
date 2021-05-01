import { useEffect, useState } from "react";
import Loading from "react-spinners/GridLoader";
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
  eventState,
  setEventState,
  setCurrentEventId,
  currentCalendarId,
  wrikeFolderId,
  createNotes,
}) => {
  const getEvents = async (currentCalendarId) => {
    setEventState({ ...eventState, loading: true });
    const res = await fetch(
      `/api/user/google/calendars/${encodeURIComponent(
        currentCalendarId
      )}/events`,
      {
        credentials: "include",
      }
    );
    if (res.ok) {
      const calendarEvents = await res.json();
      // console.log(`Events for ${currentCalendarId}:`, calendarEvents);
      if (!calendarEvents.error) {
        setEventState({
          error: null,
          events: calendarEvents,
          loading: false,
          success: true,
          message: null,
        });
      }
      if (calendarEvents.error) {
        // if events == null && !!currentCalendarId,
        // you do not have permission to consume events for the calendar you have selected
        // if events == null && !currentCalendarId
        // please select a calendar above
        setEventState({
          error: true,
          events: null,
          loading: false,
          success: false,
          message: calendarEvents.message,
        });
      }
    } else {
    }
  };
  useEffect(() => {
    /**
     * This if statement below is the reason I get a quick flash of
     * (!events && currentCalendarId), because I do have a
     * currentCalendarId, but I have not yet fetched events.
     * Potentially refactor the response from getEvents so that
     * if the user does not have permission to access the calendar,
     * that is an entirely different thing.
     *
     */
    if (currentCalendarId) {
      getEvents(currentCalendarId);
    }
  }, [currentCalendarId, setEventState]);

  const nextWeek = async () => {
    setEventState({ ...eventState, loading: true });
    console.log(
      `>>>>> nextWeek URL: /api/user/google/calendars/${currentCalendarId}/events?weekOf=${encodeURIComponent(
        eventState.events.startOfWeekISO
      )}&prevOrNext=next`
    );
    const response = await fetch(
      `/api/user/google/calendars/${currentCalendarId}/events?weekOf=${encodeURIComponent(
        eventState.events.startOfWeekISO
      )}&prevOrNext=next`
    );
    if (response.ok) {
      const calendarEvents = await response.json();
      if (!calendarEvents.error) {
        setEventState({
          error: null,
          events: calendarEvents,
          loading: false,
          success: true,
          message: null,
        });
      }
      if (calendarEvents.error) {
        setEventState({
          error: true,
          events: null,
          loading: false,
          success: false,
          message: calendarEvents.message,
        });
      }
    } else {
    }
  };
  const prevWeek = async () => {
    setEventState({ ...eventState, loading: true });
    const response = await fetch(
      `/api/user/google/calendars/${currentCalendarId}/events?weekOf=${eventState.events.startOfWeekISO}&prevOrNext=prev`
    );
    if (response.ok) {
      const calendarEvents = await response.json();
      if (!calendarEvents.error) {
        setEventState({
          error: null,
          events: calendarEvents,
          loading: false,
          success: true,
          message: null,
        });
      }
      if (calendarEvents.error) {
        setEventState({
          error: true,
          events: null,
          loading: false,
          success: false,
          message: calendarEvents.message,
        });
        setEventState({
          error: true,
          events: null,
          loading: false,
          success: false,
          message: calendarEvents.message,
        });
      }
    } else {
    }
  };
  const goToToday = async () => {
    setEventState({ ...eventState, loading: true });
    const response = await fetch(
      `/api/user/google/calendars/${currentCalendarId}/events`
    );
    if (response.ok) {
      const calendarEvents = await response.json();
      if (!calendarEvents.error) {
        setEventState({
          error: null,
          events: calendarEvents,
          loading: false,
          success: true,
          message: null,
        });
      }
      if (calendarEvents.error) {
        setEventState({
          error: true,
          events: null,
          loading: false,
          success: false,
          message: calendarEvents.message,
        });
      }
    } else {
    }
  };

  {
    console.log(">>>>> <Events /> eventState", eventState);
  }
  if (eventState.loading) {
    return (
      <EventsWrapper>
        <h4>Events</h4>
        <div
          style={{
            display: "flex",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Loading color="#DD4339" />
        </div>
      </EventsWrapper>
    );
  }
  if (eventState.events) {
    return (
      <EventsWrapper>
        <EventsHeader>
          <h4>Events</h4>
          <TodayButton onClick={goToToday}>Today</TodayButton>
          <Arrow onClick={prevWeek}>&lang;</Arrow>
          <WeekOf>Week of {eventState.events.startOfWeek}</WeekOf>
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
            {eventState.events.events.map((event) => {
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
  }
  if (eventState.error) {
    return (
      <EventsWrapper>
        <h4>Events</h4>
        <p>
          Sorry! The calendar you have chosen is not a valid Google Calendar.
          Please select a different calendar.
        </p>
      </EventsWrapper>
    );
  }
  if (!eventState.events && !currentCalendarId) {
    return (
      <EventsWrapper>
        <h4>Events</h4>
        <p>To view events, please first select a calendar above.</p>
      </EventsWrapper>
    );
  }
  return (
    <EventsWrapper>
      <h4>Events</h4>
      <div
        style={{
          display: "flex",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Loading color="#DD4339" />
      </div>
    </EventsWrapper>
  );
};

export default Events;
