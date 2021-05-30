export default function DashContainer({ children }) {
  return (
    <div
      style={{
        backgroundColor: "#f0f0f0",
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: "1fr 4fr",
        height: "100vh",
      }}
    >
      {children}
    </div>
  );
}
