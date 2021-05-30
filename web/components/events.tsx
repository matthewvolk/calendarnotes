import { useEffect, useState } from "react";
import { useToken } from "../context/token";
import authFetch from "../utils/authFetch";
import styles from "../styles/events.module.css";

export default function Events({
  currentCal,
  folderId,
  setChooseNotesLocationAlert,
}) {
  const { token } = useToken();
  const [events, setEvents] = useState(null);

  const getEvents = async () => {
    const data = await authFetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/next/events?id=${encodeURIComponent(currentCal)}`,
      token
    );
    console.log("events", data);
    setEvents(data);
  };

  useEffect(() => {
    if (token) {
      if (currentCal) {
        getEvents();
      }
    }
  }, [token, currentCal]);

  const goToToday = async () => {
    if (token) {
      if (currentCal) {
        if (events) {
          getEvents();
        }
      }
    }
  };

  const changeWeek = async (e) => {
    let prevOrNext = e.target.id;
    if (events) {
      const data = await authFetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/next/events?id=${encodeURIComponent(
          currentCal
        )}&weekOf=${encodeURIComponent(
          events.startOfWeekISO
        )}&prevOrNext=${prevOrNext}`,
        token
      );
      setEvents(data);
    }
  };

  const createNotes = async (eventId, folderId, calendarId) => {
    if (!folderId) {
      setChooseNotesLocationAlert("Please select a folder first.");
      return;
    }
    if (!calendarId) {
      console.log("No calendar selected");
      return;
    }
    console.log("Sending Request", { eventId, folderId, calendarId });

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/notes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId, folderId, calendarId }),
      }
    );

    if (!res.ok) {
      console.error("Response not OK");
    }

    if (res.ok) {
      const data = await res.json();
      console.log("Data", data);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "0.5rem",
        margin: "0 1rem 1rem 0",
        overflow: "auto",
        padding: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ margin: "0 1rem 0 0" }}>Events</h2>
        <button className={styles.button} onClick={goToToday}>
          Today
        </button>
        <div>
          <button
            className={styles.button}
            id="prev"
            onClick={changeWeek}
            style={{ margin: "0 1rem" }}
          >
            &lt;
          </button>{" "}
          Week of {events && events?.startOfWeek}
          <button
            className={styles.button}
            id="next"
            onClick={changeWeek}
            style={{ margin: "0 1rem" }}
          >
            &gt;
          </button>
        </div>
      </div>
      <div>
        <div style={{ padding: "0.1rem 0" }}>
          {events &&
            events?.events?.map((event) => {
              return (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.25fr auto 1fr",
                    margin: "1rem 0.75rem",
                    padding: "2rem",
                    borderRadius: "0.5rem",
                    boxShadow: "0px 0px 13px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {event.summary}
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {new Intl.DateTimeFormat("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    }).format(Date.parse(event.start.dateTime))}{" "}
                    -{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "numeric",
                    }).format(Date.parse(event.end.dateTime))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <button
                        className={styles.button}
                        onClick={() => {
                          createNotes(event.id, folderId, currentCal);
                        }}
                      >
                        Create Notes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
