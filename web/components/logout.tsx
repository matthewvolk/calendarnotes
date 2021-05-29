import { useRouter } from "next/router";
import { useToken } from "../context/token";
import styles from "../styles/logout.module.css";

export default function Logout() {
  const Router = useRouter();
  const { setToken } = useToken();
  return (
    <button
      className={styles.button}
      onClick={(e) => {
        e.preventDefault();
        localStorage.removeItem("cnauthtkn");
        setToken("");
        // fix with swr
        window.location.reload();
      }}
    >
      Logout
    </button>
  );
}
