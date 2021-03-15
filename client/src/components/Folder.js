import { useState } from "react";
import styled from "styled-components";
import { FaFolder, FaFolderOpen } from "react-icons/fa";

const StyledFolder = styled.div`
  padding-left: 20px;

  input {
    float: left;
    margin: 5px 5px 5px 0;
    cursor: pointer;
  }

  input:checked {
    border: 6px solid black;
  }

  .folder--label {
    display: flex;
    align-items: center;
    span {
      margin-left: 5px;
      cursor: pointer;
    }
  }
`;
const Collapsible = styled.div`
  /* set the height depending on isOpen prop */
  height: ${(p) => (p.isOpen ? "auto" : "0")};
  /* hide the excess content */
  overflow: hidden;
`;

const Folder = ({
  id,
  name,
  children,
  folderTree,
  getChildFoldersForNotesLocation,
  setWrikeFolderId,
}) => {
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
          let errorObj = await getChildFoldersForNotesLocation(folderId);
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
  };

  const handleSelection = (e) => {
    console.log("Set Notes Location to:", e.target.id);
    setWrikeFolderId(e.target.id);
  };

  return (
    <StyledFolder>
      <input
        type="radio"
        name="folderSelection"
        id={id}
        onClick={handleSelection}
      />
      <div className="folder--label" onClick={handleOpen}>
        {!isOpen ? <FaFolder /> : <FaFolderOpen />}
        <span id={id}>{name}</span>
      </div>
      <Collapsible isOpen={isOpen}>{children}</Collapsible>
    </StyledFolder>
  );
};

export default Folder;
