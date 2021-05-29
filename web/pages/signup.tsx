import Head from "next/head";
import Headline from "../components/headline";
import Layout from "../components/layout";
import GoogleLoginButton from "../components/googleLoginButton";

export default function Signup() {
  return (
    <Layout>
      <Head>
        <title>CalendarNotes - Sign Up</title>
      </Head>
      <Headline>Sign Up</Headline>
      <div style={{ textAlign: "center" }}>
        <GoogleLoginButton />
      </div>
      <br />
    </Layout>
  );
}
