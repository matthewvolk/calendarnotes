import React, { useEffect, useState } from "react";

const CalendarSelector = ({ setCurrentCalendarId }) => {
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    const getCalendarData = async () => {
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
      } else {
        setOptions(null);
      }
    };
    getCalendarData();
  }, []);

  useEffect(() => {
    /**
     * @todo change state of <Dashboard /> selected calendar
     */
    if (selectedOption) {
      setCurrentCalendarId(selectedOption);
    }
  }, [selectedOption, setCurrentCalendarId]);

  const handleSelectChange = (e) => {
    setSelectedOption(e.target.value);
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
          >
            <option disabled selected value>
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
          Could not load calendars, refresh to try again.
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
