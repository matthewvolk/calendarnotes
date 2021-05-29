import Link from "next/link";
import Image from "next/image";
import styles from "../styles/logo.module.css";

export default function Logo() {
  return (
    <Link href="/">
      <a>
        <div className={styles.flex}>
          <Image src="/calendar.svg" alt="Logo" height="70" width="70" />{" "}
          <p className={styles.text}>CalendarNotes</p>
        </div>
      </a>
    </Link>
  );
}
