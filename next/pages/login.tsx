import Nav from "../components/nav";

export default function Login() {
  const logInWithGoogle = (e) => {
    e.preventDefault();
    window.location.assign("https://localhost:8443/api/auth/google/next");
  };

  return (
    <div>
      <Nav />
      <h1>CalendarNotes Login</h1>
      <button onClick={logInWithGoogle}>Login</button>
    </div>
  );
}
