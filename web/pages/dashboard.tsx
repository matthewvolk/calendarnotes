import { useEffect, useState } from "react";
import Head from "next/head";
import Header from "../components/header";
import Events from "../components/events";
import Cookies from "universal-cookie";
import authFetch from "../utils/authFetch";
import DashContainer from "../components/dashContainer";
import FolderSelector from "../components/folderSelector";
import NotesLocationButton from "../components/notesLocationButton";

function Dashboard({ user }) {
  const [currentCal, setCurrentCal] = useState(null);
  const [notesLocation, setNotesLocation] = useState(null);
  const [folderId, setFolderId] = useState(null);
  const [chooseNotesLocationAlert, setChooseNotesLocationAlert] =
    useState(null);

  useEffect(() => {
    setCurrentCal(user.googleCalendar?.defaultCalId);
  }, []);

  useEffect(() => {
    setNotesLocation({
      current: user.notesStorage?.current,
      available: user.notesStorage?.available,
    });
  }, []);

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
                color: "#721c24",
                backgroundColor: "#f8d7da",
                borderColor: "#f5c6cb",
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
            setFolderId={setFolderId}
            notesLocation={notesLocation}
            setChooseNotesLocationAlert={setChooseNotesLocationAlert}
          />
          {notesLocation?.current === "googleDriveSafe" && (
            <div
              style={{
                color: "#987205",
                backgroundColor: "#fff7dc",
                borderColor: "#fff3c8",
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

export const getServerSideProps = async (ctx) => {
  const cookies = new Cookies(ctx.req ? ctx.req.headers.cookie : null);
  const { token: queryToken } = ctx.query;
  if (queryToken) {
    ctx.res.setHeader("set-cookie", `cnauthtkn=${queryToken}`);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/user`,
      {
        headers: {
          Authorization: `Bearer ${queryToken}`,
        },
      }
    );
    if (!response.ok) {
      return {
        redirect: {
          permanent: false,
          destination: "/login",
        },
      };
    }
    const data = await response.json();
    return {
      props: {
        token: queryToken,
        user: data,
      }, // will be passed to the page component as props
    };
  }
  const cnauthtkn = cookies.get("cnauthtkn");
  // validate cookie
  if (cnauthtkn) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/user`,
      {
        headers: {
          Authorization: `Bearer ${cnauthtkn}`,
        },
      }
    );
    if (!response.ok) {
      return {
        redirect: {
          permanent: false,
          destination: "/login",
        },
      };
    }
    const data = await response.json();
    return {
      props: {
        token: cnauthtkn,
        user: data,
      }, // will be passed to the page component as props
    };
  }
  return {
    redirect: {
      permanent: false,
      destination: "/login",
    },
  };
};

export default Dashboard;
