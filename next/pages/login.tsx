import Nav from "../components/nav";

export default function Login() {
  const logInWithGoogle = (e) => {
    e.preventDefault();
    window.location.assign(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/google`
    );
  };

  return (
    <div>
      <Nav />
      <h1>CalendarNotes Login</h1>
      <button onClick={logInWithGoogle}>Login</button>
    </div>
  );
}
