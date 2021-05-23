import Nav from "../components/nav";
import withAuth from "../components/withAuth";
import { useUser } from "../context/user";

function Dashboard() {
  const { user } = useUser();
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
      </div>
    );
  }
}

export default withAuth(Dashboard);
