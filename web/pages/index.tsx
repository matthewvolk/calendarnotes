import Layout from "../components/layout";
import Headline from "../components/headline";
import HomepageContent from "../components/homepageContent";

export default function Home() {
  return (
    <Layout>
      <Headline>
        Instantly Generate Meeting Notes for Google Calendar Events
      </Headline>
      <HomepageContent />
    </Layout>
  );
}
