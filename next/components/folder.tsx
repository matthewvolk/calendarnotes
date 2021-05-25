import { useState } from "react";

export default function Folder({
  name,
  id,
  key,
  folderTree,
  children,
  setFolderId,
  getChildFoldersForFolderId,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = async (e) => {
    e.preventDefault();
    // make sure user clicked <span> and not in the white space
    // @todo Fix CSS (make div > span a label instead)
    if (e.target.nodeName === "SPAN" && e.target.id) {
      // check that the clicked folder is not a leaf node
      if (folderTree) {
        let originalText = e.target.innerText;
        let folderId = e.target.id;
        let clickedFolder = folderTree.find((folder) => folder.id === folderId);

        // check if the clicked folder already has childFolders
        if (!clickedFolder.childFolders) {
          // prevent user from sending multiple API requests at once
          e.target.parentNode.style.pointerEvents = "none";

          // let user know their request is being processed
          e.target.style.fontWeight = "bold";
          e.target.innerText = "Loading...";

          /**
           * @todo this needs to be changed when I change client/src/layout/Dashboard.js:108
           */
          let errorObj = await getChildFoldersForFolderId(folderId);
          if (errorObj) {
            // change folder text back from "Loading..."
            e.target.style.fontWeight = "normal";
            e.target.innerText = originalText;

            // allow user to click folder again now that API request is resolved
            e.target.parentNode.style.pointerEvents = "auto";
          } else {
            setIsOpen(!isOpen);

            // change folder text back from "Loading..."
            e.target.style.fontWeight = "normal";
            e.target.innerText = originalText;

            // allow user to click folder again now that API request is resolved
            e.target.parentNode.style.pointerEvents = "auto";
          }
        } else {
          console.log("Folder already has child folders!");
          setIsOpen(!isOpen);
        }
      } else {
        console.log("Clicked a leaf node, nothing to do here");
      }
    }
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
          <span id={id}>{name}</span>
        </div>
      </div>
      <div style={{ height: isOpen ? "auto" : "0", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}
