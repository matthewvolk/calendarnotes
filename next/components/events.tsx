import { useEffect, useState } from "react";
import { useToken } from "../context/token";
import authFetch from "../utils/authFetch";

export default function Events({ currentCal, folderId }) {
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
    let prevOrNext = e.target.innerText;
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
      console.log("No folder selected");
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
    <>
      <p>
        Events <button onClick={goToToday}>Today</button>&nbsp;
        <u onClick={changeWeek}>prev</u>&nbsp; Week of:{" "}
        {events && events?.startOfWeek}&nbsp;
        <u onClick={changeWeek}>next</u>
      </p>
      <ul>
        {events &&
          events?.events?.map((event) => {
            return (
              <li
                onClick={() => {
                  createNotes(event.id, folderId, currentCal);
                }}
              >
                <b>Event: </b>
                {event.summary} <b>Date: </b>
                {event.start.dateTime} - {event.end.dateTime}
              </li>
            );
          })}
      </ul>
    </>
  );
}
