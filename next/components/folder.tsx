import { useState } from "react";

export default function Folder({
  name,
  id,
  key,
  folderTree,
  children,
  setFolderId,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const handleSelection = (e) => {
    console.log("Set Notes Location to:", e.target.id);
    setFolderId(e.target.id);
  };

  return (
    <div key={key} style={{ paddingLeft: "20px" }}>
      <div style={{ display: "flex", marginLeft: "5px" }}>
        <input
          type="radio"
          name="folderSelection"
          id={id}
          onClick={handleSelection}
        />
        <div onClick={handleOpen}>
          <span>{name}</span>
        </div>
      </div>
      <div style={{ height: isOpen ? "auto" : "0", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
