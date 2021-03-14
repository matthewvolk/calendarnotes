import { useState } from "react";
import styled from "styled-components";

const StyledFolder = styled.div`
  padding-left: 20px;

  input {
    float: left;
    margin: 5px 0 5px 0;
    cursor: pointer;
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
const StyledInput = styled.input`
  -webkit-appearance: checkbox; /* Chrome, Safari, Opera */
  -moz-appearance: checkbox; /* Firefox */
  -ms-appearance: checkbox; /* not currently supported */
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

          await getChildFoldersForNotesLocation(folderId);

          setIsOpen(!isOpen);

          // change folder text back from "Loading..."
          e.target.style.fontWeight = "normal";
          e.target.innerText = originalText;

          // allow user to click folder again now that API request is resolved
          e.target.parentNode.style.pointerEvents = "auto";
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
    setWrikeFolderId({
      id: e.target.id,
      label: e.target.innerText,
    });
  };

  return (
    <StyledFolder>
      <StyledInput
        type="radio"
        name="folderSelection"
        id={id}
        onClick={handleSelection}
      />
      <div className="folder--label" onClick={handleOpen}>
        <span id={id}>{name}</span>
      </div>
      <Collapsible isOpen={isOpen}>{children}</Collapsible>
    </StyledFolder>
  );
};

export default Folder;