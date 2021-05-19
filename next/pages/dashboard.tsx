import Nav from "../components/nav";
import { useUser } from "../context/user";
import { useRouter } from "next/router";
import { useSaveTokenFromQueryParams } from "../components/useSaveTokenFromQueryParams";

export default function Dashboard() {
  useSaveTokenFromQueryParams();
  const { push } = useRouter();
  const { loading, user } = useUser();

  if (!loading && !user) {
    push("/login");
  }

  return (
    <div>
      <Nav />
      <h1>CalendarNotes Dashboard</h1>
      {user && <div>Hello, user</div>}
    </div>
  );
}
