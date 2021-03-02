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
        console.log(currentValue); // TODO: FIX API REQUEST
      });
      // alphabetically sort options
      newData.sort((a, b) => {
        let textA = a.label.toUpperCase();
        let textB = b.label.toUpperCase();
        return textA < textB ? -1 : textA > textB ? 1 : 0;
      });
      setWrikeFolders(newData);
    };

    if (user.wrike) {
      if (user.wrike.accessToken) {
        getWrikeFolders();
      }
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
      <div className="input-group">
        <label className="input-group-text" htmlFor="notes-location">
          Notes Location:
        </label>
        <select
          className="form-select"
          id="notes-location"
          onChange={handleSelectChange}
        >
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
