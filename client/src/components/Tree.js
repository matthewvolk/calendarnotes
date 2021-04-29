import { useAuthState } from "../context/Auth";
import { useState, useEffect } from "react";
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

const Tree = ({ setWrikeFolderId, openSettings, notesStorage }) => {
  const { user } = useAuthState();
  const [folderTree, setFolderTree] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getTopLevelFoldersForNotesLocation = async () => {
      setIsLoading(true);
      const res = await fetch(`/api/user/folders`, {
        credentials: "include",
      });
      const data = await res.json();
      setFolderTree(data);
      setIsLoading(false);
    };

    const getTopLevelFoldersForNotesLocation2 = async () => {
      setIsLoading(true);
      const res2 = await fetch(`/api/user/google/drives`, {
        method: "GET",
        credentials: "include",
      });
      let data2 = await res2.json();
      console.log(data2);
      setFolderTree(data2);
      setIsLoading(false);
    };

    if (notesStorage.current === "wrike") {
      if (user.wrike) {
        if (user.wrike.accessToken) {
          getTopLevelFoldersForNotesLocation();
        }
      }
    }

    if (notesStorage.current === "googleDrive") {
      getTopLevelFoldersForNotesLocation2();
    }
  }, [user, notesStorage.current]);

  const getChildFoldersForNotesLocation = async (clickedFolderId) => {
    if (notesStorage.current === "wrike") {
      const res = await fetch(
        `/api/user/folders?clickedFolderId=${clickedFolderId}`,
        {
          credentials: "include",
        }
      );
      console.log(res);
      if (res.ok) {
        const data = await res.json();

        /**
         * @todo this needs to be changed when I change api/index.js:157
         */
        if (data.error) {
          return data;
        } else {
          // sort data alphabetically
          data.sort(function (a, b) {
            let textA = a.name.toUpperCase();
            let textB = b.name.toUpperCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
          });

          let newFolderTree = [...folderTree];

          function findRecurisvely(tree, id) {
            for (let i = 0; i < tree.length; i++) {
              if (tree[i].id === id) {
                tree[i].childFolders = data;
              } else if (
                tree[i].childFolders &&
                tree[i].childFolders.length &&
                typeof tree[i].childFolders === "object"
              ) {
                findRecurisvely(tree[i].childFolders, id);
              }
            }
          }

          findRecurisvely(newFolderTree, clickedFolderId);
          setFolderTree(newFolderTree);
        }
      } else {
        /** Error handling if res not ok */
      }
    }

    if (notesStorage.current === "googleDrive") {
      const res = await fetch(
        `/api/user/google/drives?folderId=${clickedFolderId}`,
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        // sort data alphabetically
        data.sort(function (a, b) {
          let textA = a.name.toUpperCase();
          let textB = b.name.toUpperCase();
          return textA < textB ? -1 : textA > textB ? 1 : 0;
        });

        let newFolderTree = [...folderTree];

        function findRecurisvely(tree, id) {
          for (let i = 0; i < tree.length; i++) {
            if (tree[i].id === id) {
              tree[i].childFolders = data;
            } else if (
              tree[i].childFolders &&
              tree[i].childFolders.length &&
              typeof tree[i].childFolders === "object"
            ) {
              findRecurisvely(tree[i].childFolders, id);
            }
          }
        }

        findRecurisvely(newFolderTree, clickedFolderId);
        setFolderTree(newFolderTree);
      }
    }
  };

  if (notesStorage.available) {
    if (notesStorage.available.length >= 1) {
      if (isLoading) {
        return (
          <StyledTree>
            <h4>Notes Location</h4>
            <div
              style={{
                display: "flex",
                fontSize: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ fontWeight: "500" }}>
                {
                  notesStorage.available[
                    notesStorage.available
                      .map((el) => el.id)
                      .indexOf(notesStorage.current)
                  ].name
                }
                {console.log(notesStorage)}
              </div>
              <div
                onClick={openSettings}
                style={{
                  cursor: "pointer",
                  color: "dodgerblue",
                  textDecoration: "underline",
                  border: "none",
                  backgroundColor: "inherit",
                  padding: "0",
                  marginLeft: "0.25rem",
                }}
              >
                Change
              </div>
            </div>
            <p style={{ fontWeight: "700" }}>Loading...</p>
          </StyledTree>
        );
      }

      return (
        <StyledTree>
          <h4>Notes Location</h4>
          <div
            style={{
              display: "flex",
              fontSize: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            <div style={{ fontWeight: "500" }}>
              {
                notesStorage.available[
                  notesStorage.available
                    .map((el) => el.id)
                    .indexOf(notesStorage.current)
                ].name
              }
              {console.log(notesStorage)}
            </div>
            <div
              onClick={openSettings}
              style={{
                cursor: "pointer",
                color: "dodgerblue",
                textDecoration: "underline",
                border: "none",
                backgroundColor: "inherit",
                padding: "0",
                marginLeft: "0.25rem",
              }}
            >
              Change
            </div>
          </div>
          <TreeRecursive
            folders={folderTree}
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
  } else {
    return (
      <StyledTree>
        <h4>Notes Location</h4>
        <div
          style={{
            display: "flex",
            fontSize: "0.85rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontWeight: "500" }}>Loading...</div>
          <div
            style={{
              cursor: "pointer",
              color: "dodgerblue",
              textDecoration: "underline",
              border: "none",
              backgroundColor: "inherit",
              padding: "0",
              marginLeft: "0.25rem",
            }}
          >
            Loading...
          </div>
        </div>
        <p style={{ fontWeight: "700" }}>Loading...</p>
      </StyledTree>
    );
  }
};

Tree.Folder = Folder;

export default Tree;
