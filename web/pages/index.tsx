import Nav from "../components/nav";

export default function Home() {
  return (
    <div>
      <Nav />
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src="/calendar.svg" alt="Logo" height="70" />{" "}
        <h1>CalendarNotes</h1>
      </div>
    </div>
  );
}
