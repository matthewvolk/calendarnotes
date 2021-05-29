import Nav from "./nav";
import Footer from "./footer";
import styles from "../styles/layout.module.css";

export default function Layout({ children }) {
  return (
    <div className={styles.container}>
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
