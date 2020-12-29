import React, { useEffect, useState } from "react";

const CalendarSelector = ({ setCurrentCalendarId }) => {
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    const getCalendarData = async () => {
      const res = await fetch("/api/google/calendars", {
        credentials: "include",
      });
      const calendars = await res.json();
      let newOptions = [];
      calendars.forEach((calendar) => {
        newOptions.push({
          value: calendar.id,
          label: calendar.summary,
        });
      });
      setOptions(newOptions);
    };
    getCalendarData();
  }, []);

  useEffect(() => {
    /**
     * @todo change state of <Dashboard /> selected calendar
     */
    if (selectedOption) {
      setCurrentCalendarId(selectedOption.value);
    }
  }, [selectedOption]);

  const handleSelectChange = (e) => {
    setSelectedOption({
      value: e.target.value,
      label: e.target.options[e.target.selectedIndex].text,
    });
  };

  if (options && options.length) {
    return (
      <>
        <div>
          <b>Calendar:</b>&nbsp;
        </div>
        <select onChange={handleSelectChange}>
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
      </>
    );
  } else {
    return (
      <>
        <div>
          <b>Calendar:</b>&nbsp;
        </div>
        <select disabled>
          <option>Loading...</option>
        </select>
      </>
    );
  }
};

export default CalendarSelector;
