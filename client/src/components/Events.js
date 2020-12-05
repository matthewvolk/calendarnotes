const Events = ({
  events,
  setCurrentEventId,
  currentCalendarId,
  wrikeFolderId,
}) => {
  if (events) {
    return (
      <>
        <h1>Events This Week</h1>
        <div className="table-responsive">
          <table className="table table-sm table-striped">
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
                    <td>{event.summary}</td>
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
                      }).format(
                        Date.parse(event.end.dateTime || event.end.date)
                      )}
                    </td>
                    <td>
                      {currentCalendarId && wrikeFolderId ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentEventId(event.id);
                          }}
                        >
                          Create Meeting Notes
                        </button>
                      ) : (
                        <button disabled>Create Meeting Notes</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  } else {
    return (
      <div>
        <p>
          Either you haven't selected a calendar, or you do not have permission
          to consume the events for the calendar you have chosen
        </p>
      </div>
    );
  }
};

export default Events;
