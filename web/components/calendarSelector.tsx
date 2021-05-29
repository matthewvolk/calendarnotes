import { useEffect, useState } from "react";
import { useToken } from "../context/token";
import authFetch from "../utils/authFetch";

export default function CalendarSelector({ currentCal, setCurrentCal }) {
  const { token } = useToken();
  const [calendars, setCalendars] = useState(null);

  useEffect(() => {
    const getCalendars = async () => {
      setCalendars(
        await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/next/calendars`,
          token
        )
      );
    };
    if (token) {
      getCalendars();
    }
  }, [token]);

  const handleChange = async (e) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/next/calendars/default`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: e.target.value }),
        }
      );
      if (!res.ok) {
        console.error("Response not OK", res);
        return null;
      }
      if (res.ok) {
        const data = await res.json();
        setCurrentCal(data);
      }
    } catch (err) {
      console.error("Fetch failed", err);
      return null;
    }
  };

  return (
    <div>
      <label htmlFor="calendar-select">Choose a Calendar:</label>
      <select
        name="calendars"
        id="calendar-select"
        value={currentCal}
        onChange={handleChange}
      >
        <option disabled selected>
          -- Choose Calendar --
        </option>
        {calendars &&
          calendars.map((calendar) => {
            return (
              <option key={calendar.id} value={calendar.id}>
                {calendar.summary}
              </option>
            );
          })}
      </select>
    </div>
  );
}
