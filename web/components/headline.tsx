import styles from "../styles/headline.module.css";

export default function Headline({ children }) {
  return <h1 className={styles.headline}>{children}</h1>;
}
