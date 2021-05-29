import Head from "next/head";
import Headline from "../components/headline";
import Layout from "../components/layout";
import GoogleLoginButton from "../components/googleLoginButton";

export default function Signup() {
  return (
    <Layout>
      <Head>
        <title>CalendarNotes - Sign Up</title>
        <meta
          name="description"
          content="CalendarNotes creates meeting notes in your Google Drive or cloud storage location of choice, and makes them easily accessible right from your Google Calendar."
        />
      </Head>
      <Headline>Sign Up</Headline>
      <div style={{ textAlign: "center" }}>
        <GoogleLoginButton />
      </div>
      <br />
    </Layout>
  );
}
