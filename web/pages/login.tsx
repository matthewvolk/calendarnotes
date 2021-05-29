import Head from "next/head";
import Headline from "../components/headline";
import Layout from "../components/layout";
import GoogleLoginButton from "../components/googleLoginButton";

export default function Login() {
  return (
    <Layout>
      <Head>
        <title>CalendarNotes - Log In</title>
      </Head>
      <Headline>Log In</Headline>
      <div style={{ textAlign: "center" }}>
        <GoogleLoginButton />
      </div>
      <br />
    </Layout>
  );
}
