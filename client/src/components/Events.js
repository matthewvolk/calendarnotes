const Events = ({ events }) => {
  console.log("From <Events />", events);
  if (events) {
    return (
      <>
        <h1>Events This Week</h1>
        <table className="table">
          <tbody>
            {events.map((event) => {
              return (
                <tr key={event.id}>
                  <td>
                    <b>{event.summary}</b>&nbsp;
                  </td>
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
                </tr>
              );
            })}
          </tbody>
        </table>
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
