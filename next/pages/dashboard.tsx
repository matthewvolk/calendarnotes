import Nav from "../components/nav";
import CalendarSelector from "../components/calendarSelector";
import Events from "../components/events";
import withAuth from "../components/withAuth";
import authFetch from "../utils/authFetch";
import { useToken } from "../context/token";
import { useEffect, useState } from "react";
import FolderSelector from "../components/folderSelector";

function Dashboard() {
  const { token } = useToken();
  const [user, setUser] = useState(null);
  const [currentCal, setCurrentCal] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [notesLocation, setNotesLocation] = useState(null);
  const [folderId, setFolderId] = useState(null);
  console.log("Current Calendar:", currentCal);
  console.log("Current Folder:", folderId);
  console.log("Current Event:", currentEventId);
  console.log("notesLocation", notesLocation);

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

  const googleDrive = (e) => {
    e.preventDefault();
    if (notesLocation?.available?.some((loc) => loc.id === "googleDrive")) {
      if (notesLocation?.current !== "googleDrive") {
        setNotesLocation({ ...notesLocation, current: "googleDrive" });
        // tell folder tree to get new folder tree
      }
      console.log("current notes location already googleDrive");
      return;
    }
    console.log("googleDrive not in available array, sign in with Google");
    window.location.assign(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/google/drive?token=${token}`
    );
  };

  const loginWithWrike = (e) => {
    e.preventDefault();
    if (notesLocation?.available?.some((loc) => loc.id === "wrike")) {
      if (notesLocation?.current !== "wrike") {
        setNotesLocation({ ...notesLocation, current: "wrike" });
        // tell folder tree to get new folder tree
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
        <Nav />
        <h1>CalendarNotes Dashboard</h1>
        <img src={user.picture} alt="Your Profile Picture" />
        <p>
          Hello, <a href={`mailto:${user.email}`}>{user.name}</a>
        </p>
        <CalendarSelector
          currentCal={currentCal}
          setCurrentCal={setCurrentCal}
        />
        <br />
        <button onClick={googleDrive}>Sign in with Google Drive</button>
        <button onClick={loginWithWrike}>Sign in with Wrike</button>
        <FolderSelector setFolderId={setFolderId} />
        <Events currentCal={currentCal} setCurrentEventId={setCurrentEventId} />
      </div>
    );
  }
}

export default withAuth(Dashboard);
