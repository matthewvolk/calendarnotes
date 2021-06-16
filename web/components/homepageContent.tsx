import Image from "next/image";
import styles from "../styles/homepageContent.module.css";
import goFromThis from "../public/go-from-this.png";
import toThis from "../public/to-this.png";
import calendarManagement from "../public/calendar-management.png";
import mouseCursor from "../public/mouse-cursor.png";

export default function HomepageContent() {
  return (
    <>
      <div className={styles.flex}>
        <div className={styles.imageContainer}>
          <h2 className={styles.textCenter}>Go from this...</h2>
          <div className={styles.shadow}>
            <Image
              src={goFromThis}
              alt="Screenshot of Google Calendar Event details"
              className={styles.radius}
              placeholder="blur"
            />
          </div>
        </div>
        <div className={styles.imageContainer}>
          <h2 className={styles.textCenter}>...to this...</h2>
          <div className={styles.shadow}>
            <Image
              src={toThis}
              alt="Screenshot of Google Document demonstrating what this web application can create"
              placeholder="blur"
            />
          </div>
        </div>
      </div>
      <div className={styles.singleClick}>
        <h2 className={`${styles.textCenter} ${styles.my5}`}>
          ...in a single click!
        </h2>
        <Image
          src={mouseCursor}
          alt="Image of a cartoon mouse cursor"
          placeholder="blur"
          height="60px"
          width="41px"
        />
      </div>
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
              src={calendarManagement}
              alt="Screenshot of Google Calendar Event with Calendar Notes event added"
              placeholder="blur"
            />
          </div>
        </div>
      </div>
    </>
  );
}
