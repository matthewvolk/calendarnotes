import { useAuthState } from "../context/Auth";
import styled from "styled-components";
import Folder from "./Folder";
import TreeRecursive from "./TreeRecursive";

const StyledTree = styled.div`
  line-height: 1.5;
  margin: 10px;
  padding: 15px;
  flex-basis: auto;
  flex-grow: 1;
  overflow: auto;
  min-height: 0;
  background-color: white;
  border-radius: 10px;
`;

const Tree = ({
  folders,
  setFolderTree,
  getChildFoldersForNotesLocation,
  setWrikeFolderId,
  openSettings,
}) => {
  const { user } = useAuthState();

  if (user.wrike) {
    if (!folders) {
      return (
        <StyledTree>
          <h4>Notes Location</h4>
          <p style={{ fontWeight: "700" }}>Loading...</p>
        </StyledTree>
      );
    }

    return (
      <StyledTree>
        <h4>Notes Location</h4>
        <TreeRecursive
          folders={folders}
          setFolderTree={setFolderTree}
          getChildFoldersForNotesLocation={getChildFoldersForNotesLocation}
          setWrikeFolderId={setWrikeFolderId}
        />
      </StyledTree>
    );
  } else {
    return (
      <div
        style={{
          lineHeight: "1.5",
          padding: "15px",
          backgroundColor: "white",
          margin: "10px",
          borderRadius: "10px",
        }}
      >
        <h4>Notes Location</h4>
        <p>
          Please{" "}
          <button
            onClick={openSettings}
            style={{
              cursor: "pointer",
              color: "dodgerblue",
              textDecoration: "underline",
              border: "none",
              backgroundColor: "inherit",
              padding: "0",
            }}
          >
            choose somewhere
          </button>{" "}
          to <br /> store your notes first!
        </p>
      </div>
    );
  }
};

Tree.Folder = Folder;

export default Tree;
