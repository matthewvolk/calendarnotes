import FolderSelectorRecursive from "./folderSelectorRecursive";
import Folder from "./folder";
import authFetch from "../utils/authFetch";
import { useEffect, useState } from "react";
import { useToken } from "../context/token";

const FolderSelector = ({ setFolderId }) => {
  const { token } = useToken();
  const [folderTree, setFolderTree] = useState(null);

  const getTopLevelFolders = async () => {
    const folders = await authFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/folders`,
      token
    );
    setFolderTree(folders);
  };

  useEffect(() => {
    if (token) {
      getTopLevelFolders();
    }
  }, [token]);

  const getChildFoldersForFolderId = async (folderId) => {};

  return (
    <FolderSelectorRecursive
      folderTree={folderTree}
      setFolderId={setFolderId}
    />
  );
};

FolderSelector.Folder = Folder;

export default FolderSelector;
