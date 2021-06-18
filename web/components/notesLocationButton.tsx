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
  console.log("googleDrive", googleDrive);

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
      console.log("current notes location already wrike");
      return;
    }
    console.log("googleDrive not in available array, sign in with Google");
    window.location.assign(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/wrike?token=${token}`
    );
  };

  const googleDriveLogin = async (e) => {
    e.preventDefault();
    if (notesLocation?.available?.some((loc) => loc.id === "googleDrive")) {
      if (notesLocation?.current !== "googleDrive") {
        await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/next/notes/storage?location=googleDrive`,
          token
        );
        setNotesLocation({ ...notesLocation, current: "googleDrive" });
        setFolderId(null);
        return;
      }
      console.log("current notes location already googleDrive");
      return;
    }
    console.log("googleDrive not in available array, sign in with Google");
    window.location.assign(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/google/drive?token=${token}`
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
      console.log("current notes location already googleDriveSafe");
      return;
    }
    console.log("googleDriveSafe not in available array, sign in with Google");
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
          Google Drive
        </button>
      )}
      {wrike && (
        <button className={styles.button} onClick={wrikeLogin}>
          Wrike
        </button>
      )}
    </>
  );
}
