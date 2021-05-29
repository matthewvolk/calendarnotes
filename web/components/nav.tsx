import Link from "next/link";
import authFetch from "../utils/authFetch";
import { useState, useEffect } from "react";
import { useToken } from "../context/token";
import Logo from "./logo";
import Logout from "./logout";
import styles from "../styles/nav.module.css";

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
      <nav className={styles.flex}>
        <Logo />
        <div>
          <Logout />
          <Link href="/dashboard">
            <button className={`${styles.button} ${styles.buttonPrimary}`}>
              Dashboard
            </button>
          </Link>
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className={styles.flex}>
        <Logo />
        <div>
          <Link href="/login">
            <button className={styles.button}>Log In</button>
          </Link>
          <Link href="/signup">
            <button className={`${styles.button} ${styles.buttonPrimary}`}>
              Sign Up
            </button>
          </Link>
        </div>
      </nav>
    );
  }
}
