import Folder from "./Folder";

const TreeRecursive = ({
  folders,
  getChildFoldersForNotesLocation,
  setWrikeFolderId,
}) => {
  return folders.map((folder) => {
    // folder.childFolders var is equal to the folder structure of the folder that was just clicked.
    if (!folder.hasChildFolders) {
      // this folder would never setFolderTree because it's the leaf node
      return (
        <Folder
          name={folder.name}
          id={folder.id}
          key={folder.id}
          setWrikeFolderId={setWrikeFolderId}
        />
      );
    }

    if (folder.hasChildFolders) {
      return (
        <Folder
          name={folder.name}
          id={folder.id}
          key={folder.id}
          folderTree={folders}
          getChildFoldersForNotesLocation={getChildFoldersForNotesLocation}
          setWrikeFolderId={setWrikeFolderId}
        >
          {!!folder.childFolders ? (
            // every time TreeRecursive renders a new child directory (IPM Space > child directory), it sets the global folder tree to that (most recently rendered) sub directory
            <TreeRecursive
              folders={folder.childFolders} // setting it to folders causes infinite loop
              getChildFoldersForNotesLocation={getChildFoldersForNotesLocation}
              setWrikeFolderId={setWrikeFolderId}
            />
          ) : null}
        </Folder>
      );
    }
  });
};

export default TreeRecursive;
