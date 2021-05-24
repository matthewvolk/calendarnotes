import Link from "next/link";
import authFetch from "../utils/authFetch";
import { useState, useEffect } from "react";
import { useToken } from "../context/token";

export default function Nav() {
  const [user, setUser] = useState(null);
  const { token, setToken } = useToken();

  useEffect(() => {
    const getCalendars = async () => {
      setUser(
        await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/next/user`,
          token
        )
      );
    };
    if (token) {
      getCalendars();
    }
  }, [token]);

  if (user) {
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

  if (!user) {
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
