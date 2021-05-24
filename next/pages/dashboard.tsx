import Nav from "../components/nav";
import withAuth from "../components/withAuth";
import authFetch from "../utils/authFetch";
import { useToken } from "../context/token";
import { useEffect, useState } from "react";

function Dashboard() {
  const { token } = useToken();
  const [calendars, setCalendars] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getCalendars = async () => {
      setCalendars(
        await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/next/calendars`,
          token
        )
      );
    };
    if (token) {
      getCalendars();
    }
  }, [token]);

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

  const fetchEvents = async (e) => {
    e.preventDefault();
    console.log(e.target.innerText);
    if (token) {
      console.log(
        await authFetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/api/next/events?id=${encodeURIComponent(e.target.innerText)}`,
          token
        )
      );
    }
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
        {calendars ? (
          <div>
            Calendars
            <ul>
              {calendars.map((calendar) => (
                <li onClick={fetchEvents} key={calendar.id}>
                  {calendar.id}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }
}

export default withAuth(Dashboard);
