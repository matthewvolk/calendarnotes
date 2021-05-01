import { useAuthState } from "../context/Auth";
import React, { useEffect, useState } from "react";

const CalendarSelector = ({
  setCurrentCalendarId,
  setEventState,
  eventState,
}) => {
  const { user } = useAuthState();
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(user.defaultCalendar);

  const getCalendarData = async () => {
    setEventState({ ...eventState, loading: true });
    const res = await fetch("/api/user/google/calendars", {
      credentials: "include",
    });

    if (res.ok) {
      const calendars = await res.json();
      let newOptions = [];
      calendars.forEach((calendar) => {
        newOptions.push({
          value: calendar.id,
          label: calendar.summary,
        });
      });
      setOptions(newOptions);
      setEventState({ ...eventState, loading: false });
    } else {
      setOptions(null);
    }
  };

  useEffect(() => {
    getCalendarData();
  }, []);

  useEffect(() => {
    if (selectedOption) {
      setCurrentCalendarId(selectedOption);
    }
  }, [selectedOption, setCurrentCalendarId]);

  const handleSelectChange = async (e) => {
    const response = await fetch("/api/user/google/calendars/default", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ calendarId: e.target.value }),
    });
    if (response.ok) {
      const data = await response.json();
      setSelectedOption(data);
    }
    if (!response.ok) {
      setSelectedOption(null);
    }
  };

  if (options && options.length) {
    return (
      <div>
        <div className="input-group">
          <label className="input-group-text" htmlFor="calendar-selector">
            Calendar:
          </label>
          <select
            className="form-select"
            id="calendar-selector"
            onChange={handleSelectChange}
            value={selectedOption ? selectedOption : "default"}
          >
            <option disabled selected value="default">
              {" "}
              Choose Calendar{" "}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  } else if (options === null) {
    return (
      <div>
        <p style={{ color: "red", marginBottom: 0 }}>
          Could not load calendars.{" "}
          <button onClick={getCalendarData}>Try Again.</button>
        </p>
      </div>
    );
  } else {
    return (
      <div>
        <div className="input-group">
          <label
            className="input-group-text"
            htmlFor="loading-calendar-selector"
          >
            Calendar:
          </label>
          <select
            className="form-select"
            id="loading-calendar-selector"
            disabled
          >
            <option>Loading...</option>
          </select>
        </div>
      </div>
    );
  }
};

export default CalendarSelector;
