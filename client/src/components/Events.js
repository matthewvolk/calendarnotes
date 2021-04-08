import Table from "react-bootstrap/Table";
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

const Events = ({
  events,
  setCurrentEventId,
  currentCalendarId,
  wrikeFolderId,
  createNotes,
}) => {
  if (events) {
    return (
      <EventsWrapper>
        <h4>Events This Week</h4>
        <Table responsive striped bordered hover size="sm">
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Date/Time</th>
              <th scope="col">Create Notes</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
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
                      <button
                        className="btn btn-secondary"
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
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        disabled
                        data-tip="You must first select a 'Notes Location' above!"
                      >
                        Select Notes Location First
                      </button>
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
