import Image from "next/image";
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
        <p style={{ fontWeight: 600, fontSize: "1.35rem" }}>CalendarNotes</p>
      </div>
      <CalendarSelector currentCal={currentCal} setCurrentCal={setCurrentCal} />
      <div style={{ display: "flex", alignItems: "center" }}>
        <Logout />
        {/* @todo https://nextjs.org/docs/api-reference/next/image#src */}
        <img
          src={user.picture}
          alt="Your Profile Picture"
          height="40"
          width="40"
          style={{ borderRadius: "2rem", margin: "0 1rem" }}
        />
      </div>
    </header>
  );
}
