import { useEffect, useState } from "react";
import { useToken } from "../context/token";
import authFetch from "../utils/authFetch";

export default function Events({ currentCal, setCurrentEventId }) {
  const { token } = useToken();
  const [events, setEvents] = useState(null);

  const getEvents = async () => {
    const data = await authFetch(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/api/next/events?id=${encodeURIComponent(currentCal)}`,
      token
    );
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
                  setCurrentEventId(event.id);
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
