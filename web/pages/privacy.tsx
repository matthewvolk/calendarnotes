import Head from "next/head";
import Headline from "../components/headline";
import Layout from "../components/layout";

export default function Privacy() {
  return (
    <Layout>
      <Head>
        <title>CalendarNotes - Privacy Policy</title>
        <meta
          name="description"
          content="CalendarNotes creates meeting notes in your Google Drive or cloud storage location of choice, and makes them easily accessible right from your Google Calendar."
        />
      </Head>
      <Headline>Privacy Policy</Headline>
    </Layout>
  );
}
