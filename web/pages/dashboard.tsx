import { useToken } from "../context/token";
import { useEffect, useState } from "react";
import Head from "next/head";
import Header from "../components/header";
import Events from "../components/events";
import withAuth from "../components/withAuth";
import authFetch from "../utils/authFetch";
import DashContainer from "../components/dashContainer";
import FolderSelector from "../components/folderSelector";
import NotesLocationButton from "../components/notesLocationButton";

function Dashboard() {
  const { token } = useToken();
  const [user, setUser] = useState(null);
  const [currentCal, setCurrentCal] = useState(null);
  const [notesLocation, setNotesLocation] = useState(null);
  const [folderId, setFolderId] = useState(null);
  const [chooseNotesLocationAlert, setChooseNotesLocationAlert] =
    useState(null);

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

  if (!user) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <>
        <Head>
          <title>CalendarNotes - Dashboard</title>
        </Head>
        <DashContainer>
          <Header
            currentCal={currentCal}
            setCurrentCal={setCurrentCal}
            user={user}
          />
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "0.5rem",
              margin: "0 0 1rem 1rem",
              padding: "1rem",
              overflow: "auto",
            }}
          >
            <h2 style={{ margin: "0 0 1rem 0" }}>Notes Location</h2>
            {chooseNotesLocationAlert && (
              <div
                style={{
                  color: "red",
                  backgroundColor: "#ffe5e5",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                {chooseNotesLocationAlert}
              </div>
            )}
            <NotesLocationButton
              notesLocation={notesLocation}
              setNotesLocation={setNotesLocation}
              setFolderId={setFolderId}
              googleDrive
            />
            <NotesLocationButton
              notesLocation={notesLocation}
              setNotesLocation={setNotesLocation}
              setFolderId={setFolderId}
              wrike
            />
            <FolderSelector
              folderId={folderId}
              setFolderId={setFolderId}
              notesLocation={notesLocation}
              setChooseNotesLocationAlert={setChooseNotesLocationAlert}
            />
            {notesLocation?.current === "googleDriveSafe" && (
              <div
                style={{
                  color: "#987205",
                  backgroundColor: "#fff7dc",
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  marginBottom: "1rem",
                  marginTop: "2rem",
                }}
              >
                <strong>Note:</strong> For security reasons, <br />
                the Google Drive API <br />
                places restrictions on the <br />
                data that apps such as <br />
                CalendarNotes are allowed
                <br /> to view from your Google
                <br /> Drive. For this reason,
                <br /> all notes must be created <br />
                in a "CalendarNotes" folder in <br />
                your "My Drive". If you need <br />
                the notes file to be placed <br />
                in another folder, please <br />
                move the file within your
                <br /> Google Drive manually.
              </div>
            )}
          </div>
          <Events
            currentCal={currentCal}
            folderId={folderId}
            setChooseNotesLocationAlert={setChooseNotesLocationAlert}
          />
        </DashContainer>
      </>
    );
  }
}

export default withAuth(Dashboard);
