import Image from "next/image";
import styles from "../styles/homepageContent.module.css";

export default function HomepageContent() {
  return (
    <>
      <div className={styles.flex}>
        <div className={styles.imageContainer}>
          <h2 className={styles.textCenter}>Go from this...</h2>
          <div className={styles.shadow}>
            <Image
              src="/go-from-this.png"
              alt="Screenshot of Google Calendar Event details"
              layout="responsive"
              height="320"
              width="526"
              className={styles.radius}
            />
          </div>
        </div>
        <div className={styles.imageContainer}>
          <h2 className={styles.textCenter}>...to this...</h2>
          <div className={styles.shadow}>
            <Image
              src="/to-this.png"
              alt="Screenshot of Google Document demonstrating what this web application can create"
              layout="responsive"
              height="320px"
              width="526px"
            />
          </div>
        </div>
      </div>
      <h2 className={`${styles.textCenter} ${styles.my5}`}>
        ...in a single click!
      </h2>
      <div className={styles.flex}>
        <div className={styles.textContainer}>
          <h2 className={styles.heading2}>Calendar Management</h2>
          <p className={styles.blurb}>
            CalendarNotes creates meeting notes in your Google Drive (or other
            cloud storage location of choice), and makes them easily accessible
            right from your Google Calendar.
          </p>
        </div>
        <div className={styles.imageContainer}>
          <div className={styles.shadow}>
            <Image
              src="/calendar-management.png"
              alt="Screenshot of Google Calendar Event with Calendar Notes event added"
              layout="responsive"
              height="212.7px"
              width="526px"
            />
          </div>
        </div>
      </div>
    </>
  );
}
