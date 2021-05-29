import Head from "next/head";
import Layout from "../components/layout";
import Headline from "../components/headline";
import HomepageContent from "../components/homepageContent";

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>
          CalendarNotes - Instantly generate meeting notes for Google Calendar
          events
        </title>
        <meta
          name="description"
          content="CalendarNotes creates meeting notes in your Google Drive or cloud storage location of choice, and makes them easily accessible right from your Google Calendar."
        />
      </Head>
      <Headline>
        Instantly Generate Meeting Notes for Google Calendar Events
      </Headline>
      <HomepageContent />
    </Layout>
  );
}
