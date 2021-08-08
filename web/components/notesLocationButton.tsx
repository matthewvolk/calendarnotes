import authFetch from "../utils/authFetch";
import { useToken } from "../context/token";
import styles from "../styles/notesLocationButton.module.css";

interface Props {
  notesLocation: any;
  setNotesLocation: any;
  setFolderId: any;
  googleDrive?: any;
  wrike?: any;
}

export default function NotesLocationButton({
  notesLocation,
  setNotesLocation,
  setFolderId,
  googleDrive,
  wrike,
}: Props) {
  const { token } = useToken();

  const wrikeLogin = async (e) => {
    e.preventDefault();
    if (notesLocation?.available?.some((loc) => loc.id === "wrike")) {
      if (notesLocation?.current !== "wrike") {
        await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/next/notes/storage?location=wrike`,
          token
        );
        setNotesLocation({ ...notesLocation, current: "wrike" });
        setFolderId(null);
        return;
      }
      return;
    }
    window.location.assign(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/wrike?token=${token}`
    );
  };

  const googleDriveLoginSafe = async (e) => {
    e.preventDefault();
    if (notesLocation?.available?.some((loc) => loc.id === "googleDriveSafe")) {
      if (notesLocation?.current !== "googleDriveSafe") {
        console.log("hello");
        await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/next/notes/storage?location=googleDriveSafe`,
          token
        );
        setNotesLocation({ ...notesLocation, current: "googleDriveSafe" });
        setFolderId(null);
        return;
      }
      return;
    }
    window.location.assign(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/google/drive/safe?token=${token}`
    );
  };

  return (
    <>
      {googleDrive && (
        <button
          className={`${styles.button} ${styles.mr}`}
          onClick={googleDriveLoginSafe}
        >
          Log In with Google Drive
        </button>
      )}
      {/* {wrike && (
        <button className={styles.button} onClick={wrikeLogin}>
          Wrike
        </button>
      )} */}
    </>
  );
}
