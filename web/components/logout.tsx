import styles from "../styles/logout.module.css";
import Cookies from "universal-cookie";
import Router from "next/router";
import { useToken } from "../context/token";

export default function Logout() {
  const { setToken } = useToken();
  return (
    <button
      className={styles.button}
      onClick={(e) => {
        e.preventDefault();
        const cookies = new Cookies();
        cookies.remove("cnauthtkn", { path: "/" });
        setToken("");
        // fix with swr
        Router.push("/login");
      }}
    >
      Logout
    </button>
  );
}
