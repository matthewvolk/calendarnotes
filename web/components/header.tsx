import Image from "next/image";
import Link from "next/link";
import CalendarSelector from "./calendarSelector";
import Logout from "./logout";

export default function Header({ currentCal, setCurrentCal, user }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "white",
        gridColumn: "1/3",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginLeft: "0.5rem",
        }}
      >
        <Image src="/calendar.svg" alt="Logo" height="50" width="50" />
        <h1
          style={{ fontWeight: 600, fontSize: "1.35rem", margin: "1.1rem 0" }}
        >
          CalendarNotes
        </h1>
      </div>
      <CalendarSelector currentCal={currentCal} setCurrentCal={setCurrentCal} />
      <div style={{ display: "flex", alignItems: "center" }}>
        <Logout />
        {/* @todo https://nextjs.org/docs/api-reference/next/image#src */}
        {/* <Link href="/settings"> */}
        <img
          src={user.picture}
          alt="Your Profile Picture"
          height="40"
          width="40"
          style={{
            borderRadius: "100%",
            margin: "0 1rem",
            cursor: "pointer",
          }}
        />
        {/* </Link> */}
      </div>
    </header>
  );
}
