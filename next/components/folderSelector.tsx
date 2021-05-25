import FolderSelectorRecursive from "./folderSelectorRecursive";
import Folder from "./folder";
import authFetch from "../utils/authFetch";
import { useEffect, useState } from "react";
import { useToken } from "../context/token";

const FolderSelector = ({ setFolderId, notesLocation, folderId }) => {
  const { token } = useToken();
  const [folderTree, setFolderTree] = useState(null);

  const getTopLevelFolders = async () => {
    const folders = await authFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/folders?location=${notesLocation.current}`,
      token
    );
    console.log("folders", folders);
    setFolderTree(folders);
  };

  useEffect(() => {
    if (token) {
      if (notesLocation?.current) {
        getTopLevelFolders();
      }
    }
  }, [token, notesLocation]);

  const getChildFoldersForFolderId = async (folderId) => {
    const folders = await authFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/folders?location=${notesLocation.current}&folderId=${folderId}`,
      token
    );
    // sort data alphabetically
    folders.sort(function (a, b) {
      let textA = a.name.toUpperCase();
      let textB = b.name.toUpperCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });

    let newFolderTree = [...folderTree];

    function findRecurisvely(tree, id) {
      for (let i = 0; i < tree.length; i++) {
        if (tree[i].id === id) {
          tree[i].children = folders;
        } else if (
          tree[i].children &&
          tree[i].children.length &&
          typeof tree[i].children === "object"
        ) {
          findRecurisvely(tree[i].children, id);
        }
      }
    }

    findRecurisvely(newFolderTree, folderId);
    setFolderTree(newFolderTree);
  };

  return (
    <FolderSelectorRecursive
      folderTree={folderTree}
      setFolderId={setFolderId}
      getChildFoldersForFolderId={getChildFoldersForFolderId}
    />
  );
};

FolderSelector.Folder = Folder;

export default FolderSelector;
