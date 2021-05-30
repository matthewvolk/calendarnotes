import { useEffect, useState } from "react";
import { useToken } from "../context/token";
import authFetch from "../utils/authFetch";
import Head from "next/head";
import Link from "next/link";
import withAuth from "../components/withAuth";

function Settings() {
  const { token } = useToken();
  const [user, setUser] = useState(null);

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

  if (!user) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <>
        <Head>
          <title>CalendarNotes - Settings</title>
        </Head>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: "800px",
            margin: "5rem auto",
          }}
        >
          <div style={{ display: "flex" }}>
            <img
              src={user.picture}
              alt="Your Profile Picture"
              height="100"
              width="100"
              style={{
                borderRadius: "100%",
                margin: "0 1rem",
                cursor: "pointer",
              }}
            />
            <h1
              style={{
                fontSize: "3rem",
                marginLeft: "2rem",
              }}
            >
              Settings
            </h1>
          </div>
          <Link href="/dashboard">
            <a style={{ textDecoration: "underline", color: "gray" }}>
              Back to Dashboard &raquo;
            </a>
          </Link>
        </div>
        <div
          style={{
            maxWidth: "800px",
            margin: "5rem auto",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "5rem" }}>🚧</div>
          <h2 style={{ fontWeight: 600 }}>Coming Soon!</h2>
        </div>
      </>
    );
  }
}

export default withAuth(Settings);
