import Folder from "./folder";

export default function FolderSelectorRecursive({
  folderTree,
  setFolderId,
  getChildFoldersForFolderId,
  setChooseNotesLocationAlert,
}) {
  if (!folderTree) {
    return <div>Loading</div>;
  }
  return folderTree.map((folder) => {
    if (!folder.hasChildFolders) {
      return (
        <Folder
          name={folder.name}
          id={folder.id}
          key={folder.id}
          setFolderId={setFolderId}
          children={null}
          folderTree={null}
          getChildFoldersForFolderId={getChildFoldersForFolderId}
          setChooseNotesLocationAlert={setChooseNotesLocationAlert}
        />
      );
    }
    if (folder.hasChildFolders) {
      return (
        <Folder
          name={folder.name}
          id={folder.id}
          key={folder.id}
          setFolderId={setFolderId}
          folderTree={folderTree}
          getChildFoldersForFolderId={getChildFoldersForFolderId}
          setChooseNotesLocationAlert={setChooseNotesLocationAlert}
        >
          {!!folder.children ? (
            // every time TreeRecursive renders a new child directory (IPM Space > child directory), it sets the global folder tree to that (most recently rendered) sub directory
            <FolderSelectorRecursive
              folderTree={folder.children} // setting it to folders causes infinite loop
              setFolderId={setFolderId}
              getChildFoldersForFolderId={getChildFoldersForFolderId}
              setChooseNotesLocationAlert={setChooseNotesLocationAlert}
            />
          ) : null}
        </Folder>
      );
    }
  });
}
