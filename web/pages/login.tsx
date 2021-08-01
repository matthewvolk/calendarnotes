import Head from "next/head";
import Headline from "../components/headline";
import Cookies from "universal-cookie";
import Layout from "../components/layout";
import GoogleLoginButton from "../components/googleLoginButton";

function Login() {
  return (
    <Layout>
      <Head>
        <title>CalendarNotes - Log In</title>
        <meta
          name="description"
          content="CalendarNotes creates meeting notes in your Google Drive or cloud storage location of choice, and makes them easily accessible right from your Google Calendar."
        />
      </Head>
      <Headline>Log In</Headline>
      <div style={{ textAlign: "center" }}>
        <GoogleLoginButton />
      </div>
      <br />
    </Layout>
  );
}

export const getServerSideProps = async (ctx) => {
  const cookies = new Cookies(ctx.req ? ctx.req.headers.cookie : null);
  const cnauthtkn = cookies.get("cnauthtkn");
  // validate cookie
  if (cnauthtkn) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/user`,
      {
        headers: {
          Authorization: `Bearer ${cnauthtkn}`,
        },
      }
    );
    if (response.ok) {
      return {
        redirect: {
          permanent: false,
          destination: "/dashboard",
        },
      };
    }
  }

  return {
    props: {}, // will be passed to the page component as props
  };
};

export default Login;
