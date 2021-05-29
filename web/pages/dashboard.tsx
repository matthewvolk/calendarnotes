import Head from "next/head";
import CalendarSelector from "../components/calendarSelector";
import Events from "../components/events";
import withAuth from "../components/withAuth";
import authFetch from "../utils/authFetch";
import { useToken } from "../context/token";
import { useEffect, useState } from "react";
import FolderSelector from "../components/folderSelector";
import Logout from "../components/logout";
import Image from "next/image";

function Dashboard() {
  const { token } = useToken();
  const [user, setUser] = useState(null);
  const [currentCal, setCurrentCal] = useState(null);
  const [notesLocation, setNotesLocation] = useState(null);
  const [folderId, setFolderId] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      setUser(
        await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/next/user`,
          token
        )
      );
    };
    if (token) {
      getUser();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      setCurrentCal(user.googleCalendar?.defaultCalId);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setNotesLocation({
        current: user.notesStorage?.current,
        available: user.notesStorage?.available,
      });
    }
  }, [user]);

  const googleDrive = async (e) => {
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

  const wrike = async (e) => {
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

  if (!user) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <div>
        <Head>
          <title>CalendarNotes - Dashboard</title>
        </Head>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Image src="/calendar.svg" alt="Logo" height="65" width="65" />
          <CalendarSelector
            currentCal={currentCal}
            setCurrentCal={setCurrentCal}
          />
          <div style={{ display: "flex", alignItems: "center" }}>
            <Logout />
            {/* @todo https://nextjs.org/docs/api-reference/next/image#src */}
            <img
              src={user.picture}
              alt="Your Profile Picture"
              height="45"
              width="45"
              style={{ borderRadius: "2rem", margin: "0 1rem" }}
            />
          </div>
        </div>
        <button onClick={googleDrive}>Google Drive</button>
        <button onClick={wrike}>Wrike</button>
        <FolderSelector
          folderId={folderId}
          setFolderId={setFolderId}
          notesLocation={notesLocation}
        />
        <Events currentCal={currentCal} folderId={folderId} />
      </div>
    );
  }
}

export default withAuth(Dashboard);
