import Link from "next/link";
import { useToken } from "../context/token";
import { useUser } from "../context/user";

export default function Nav() {
  const user = useUser();
  const { setToken } = useToken();
  if (user.user) {
    return (
      <nav>
        <ul>
          <li>
            <Link href="/">
              <a>Home</a>
            </Link>
          </li>
          <li>
            <Link href="/dashboard">
              <a>Dashboard</a>
            </Link>
          </li>
          <li>
            <a
              onClick={(e) => {
                e.preventDefault();
                localStorage.removeItem("cnauthtkn");
                setToken("");
                // fix with swr
                window.location.reload();
              }}
            >
              Logout
            </a>
          </li>
          <li>
            <Link href="/terms">
              <a>Terms</a>
            </Link>
          </li>
          <li>
            <Link href="/privacy">
              <a>Privacy</a>
            </Link>
          </li>
        </ul>
      </nav>
    );
  }

  if (!user.user) {
    return (
      <nav>
        <ul>
          <li>
            <Link href="/">
              <a>Home</a>
            </Link>
          </li>
          <li>
            <Link href="/dashboard">
              <a>Dashboard</a>
            </Link>
          </li>
          <li>
            <Link href="/login">
              <a>Login</a>
            </Link>
          </li>
          <li>
            <Link href="/terms">
              <a>Terms</a>
            </Link>
          </li>
          <li>
            <Link href="/privacy">
              <a>Privacy</a>
            </Link>
          </li>
        </ul>
      </nav>
    );
  }
}
