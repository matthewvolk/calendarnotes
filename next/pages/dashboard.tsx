import { useEffect, useState } from "react";
import Nav from "../components/nav";
import withAuth from "../components/withAuth";
import { useToken } from "../context/token";
import { useUser } from "../context/user";

function Dashboard() {
  const { user } = useUser();
  const { token } = useToken();
  const [calendars, setCalendars] = useState(null);

  useEffect(() => {
    const getCals = async () => {
      const res = await fetch("https://localhost:8443/api/user/cals/next", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setCalendars(data);
    };
    if (token) {
      getCals();
    }
  }, [token]);

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
                <li key={calendar.id}>{calendar.summary}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }
}

export default withAuth(Dashboard);
