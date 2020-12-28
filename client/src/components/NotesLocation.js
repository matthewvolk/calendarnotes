import { useState, useEffect } from "react";
import { useAuthState } from "../context/Auth";

const NotesLocation = ({ setWrikeFolderId }) => {
  const { user } = useAuthState();
  const [wrikeFolders, setWrikeFolders] = useState([]);

  useEffect(() => {
    const getWrikeFolders = async () => {
      const res = await fetch(`/api/wrike/folders`, {
        credentials: "include",
      });
      const data = await res.json();
      const newData = [];
      data.spaces.data.forEach((currentValue) => {
        newData.push({
          value: currentValue.id,
          label: currentValue.title,
        });
      });
      setWrikeFolders(newData);
    };

    if (user.wrikeAccessToken) {
      getWrikeFolders();
    }
  }, []);

  const handleSelectChange = (e) => {
    setWrikeFolderId({
      id: e.target.value,
      label: e.target.options[e.target.selectedIndex].text,
    });
  };

  if (wrikeFolders && wrikeFolders.length) {
    return (
      <div>
        <b>Notes Location:</b>&nbsp;
        <select onChange={handleSelectChange}>
          <option disabled selected value>
            {" "}
            Choose Location{" "}
          </option>
          {wrikeFolders.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  } else {
    return null;
  }
};

export default NotesLocation;
