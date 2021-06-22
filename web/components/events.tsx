import { useEffect, useState } from "react";
import { useToken } from "../context/token";
import authFetch from "../utils/authFetch";
import styles from "../styles/events.module.css";
import Event from "./event";

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "0 0 0.75rem 0",
        }}
      >
        <h2 style={{ margin: "0 1rem 0 0" }}>Events</h2>
        <button className={styles.button} onClick={goToToday}>
          Today
        </button>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            className={styles.button}
            id="prev"
            onClick={changeWeek}
            style={{ margin: "0 1rem" }}
          >
            &lt;
          </button>{" "}
          <div style={{ fontSize: "1.1rem", color: "#3e3e3e" }}>
            Week of {events && events?.startOfWeek}
          </div>
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
                <Event
                  event={event}
                  folderId={folderId}
                  currentCal={currentCal}
                  setChooseNotesLocationAlert={setChooseNotesLocationAlert}
                />
              );
            })}
          {!currentCal && (
            <div
              style={{
                color: "#856404",
                backgroundColor: "#fff3cd",
                borderColor: "#ffeeba",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                marginTop: "",
              }}
            >
              Please select a Google Calendar from the dropdown above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
