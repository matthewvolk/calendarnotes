import Layout from "../components/layout";

export default function Login() {
  const logInWithGoogle = (e) => {
    e.preventDefault();
    window.location.assign(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/google`
    );
  };

  return (
    <Layout>
      {/* <h1>CalendarNotes Login</h1> */}
      <button onClick={logInWithGoogle}>Click Here to Login with Google</button>
      <br />
    </Layout>
  );
}
