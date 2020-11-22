import React, { useEffect, useState } from "react";

const CalendarSelector = () => {
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    const getCalendarData = async () => {
      const res = await fetch("/api/google/calendars", {
        credentials: "include",
      });
      const data = await res.json();
      let newOptions = [];
      data.items.forEach((currentValue) => {
        newOptions.push({
          value: currentValue.id,
          label: currentValue.summary,
        });
      });
      setOptions(newOptions);
    };
    getCalendarData();
  }, []);

  useEffect(() => {
    const getEvents = async (calendarId) => {
      console.log(encodeURIComponent(calendarId));
      const res = await fetch(
        `/api/google/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (data.error) {
        console.log(
          "Oops! You don't have permission to consume that calendar."
        );
      } else {
        console.log(data);
      }
    };

    if (selectedOption) {
      getEvents(selectedOption.value);
    } else {
      console.log("No selected option");
    }
  }, [selectedOption]);

  const handleSelectChange = (e) => {
    setSelectedOption({
      value: e.target.value,
      label: e.target.options[e.target.selectedIndex].text,
    });
  };

  if (options && options.length > 1) {
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
