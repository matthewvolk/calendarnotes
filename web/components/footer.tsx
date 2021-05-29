import Link from "next/link";
import styles from "../styles/footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Link href="/terms">
        <a className={styles.link}>Terms</a>
      </Link>
      <Link href="/privacy">
        <a className={styles.link}>Privacy</a>
      </Link>
    </footer>
  );
}
