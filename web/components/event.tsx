import React, { useState } from "react";
import styles from "../styles/events.module.css";
import { useToken } from "../context/token";

interface EventProps {
  event: {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
  };
  folderId: string;
  currentCal: string;
  setChooseNotesLocationAlert: any;
}

export const Event: React.FC<EventProps> = ({
  event,
  folderId,
  currentCal,
  setChooseNotesLocationAlert,
}) => {
  const { token } = useToken();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const createNotes = async (eventId, folderId, calendarId) => {
    setLoading(true);
    if (!folderId) {
      setChooseNotesLocationAlert("Please select a folder first.");
      setLoading(false);
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
      setLoading(false);
      setError(true);
    }

    if (res.ok) {
      const data = await res.json();
      console.log("Data", data);
      setLoading(false);
      setSuccess(true);
    }
  };

  return (
    <div
      key={event.id}
      style={{
        display: "grid",
        gap: "1.5rem",
        gridTemplateColumns: "1.25fr auto 1fr",
        margin: "1rem 0.75rem",
        padding: "2rem",
        borderRadius: "0.5rem",
        boxShadow: "0px 0px 25px rgba(0, 0, 0, 0.05)",
      }}
    >
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          margin: "0",
          fontSize: "1.15rem",
          fontWeight: 600,
        }}
      >
        {event.summary}
      </h3>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "1.1rem",
          color: "#3e3e3e",
        }}
      >
        {new Intl.DateTimeFormat("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        }).format(Date.parse(event.start.dateTime || event.start.date))}{" "}
        -{" "}
        {new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "numeric",
        }).format(Date.parse(event.end.dateTime || event.end.date))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <div>
          {loading && (
            <button disabled className={styles.button}>
              Loading...
            </button>
          )}
          {success && (
            <button disabled className={styles.button}>
              Created!
            </button>
          )}
          {error && (
            <button
              className={styles.button}
              onClick={() => {
                createNotes(event.id, folderId, currentCal);
              }}
            >
              Error! Try Again
            </button>
          )}
          {!loading && !success && !error && (
            <button
              className={styles.button}
              onClick={() => {
                createNotes(event.id, folderId, currentCal);
              }}
            >
              Create Notes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Event;
