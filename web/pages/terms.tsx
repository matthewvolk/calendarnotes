import Head from "next/head";
import Link from "next/link";
import Headline from "../components/headline";
import Layout from "../components/layout";

export default function Terms() {
  return (
    <Layout>
      <Head>
        <title>CalendarNotes - Terms of Service</title>
        <meta
          name="description"
          content="CalendarNotes creates meeting notes in your Google Drive or cloud storage location of choice, and makes them easily accessible right from your Google Calendar."
        />
      </Head>
      <Headline>Terms of Service</Headline>
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          fontSize: "1.15rem",
        }}
      >
        <p style={{ fontWeight: 300 }}>
          Please read these terms of use ("terms of use", "agreement") carefully
          before using the CalendarNotes.io website/application ("website",
          "service", "application") operated by CalendarNotes.io ("us", "we",
          "our").
        </p>
        <h2 style={{ fontSize: "2rem" }}>Conditions of Use</h2>
        <p style={{ fontWeight: 300 }}>
          By using this website, you certify that you have read and reviewed
          this agreement and that you agree to comply with its terms. If you do
          not want to be bound by the terms of this agreement, you are advised
          to leave this website accordingly. CalendarNotes.io only grants use
          and access of this website, its products, and its services to those
          who have accepted its terms.
        </p>
        <h2 style={{ fontSize: "2rem" }}>Privacy Policy</h2>
        <p style={{ fontWeight: 300 }}>
          Before you continue using our website, we advise you to read our{" "}
          <Link href="/privacy">
            <a style={{ textDecoration: "underline" }}>privacy policy</a>
          </Link>
          regarding our user data collection. It will help you better understand
          our practices.
        </p>
        <h2 style={{ fontSize: "2rem" }}>Age Restriction</h2>
        <p style={{ fontWeight: 300 }}>
          You must be at least 18 (eighteen) years of age before you can use
          this website. By using this website, you warrant that you are at least
          18 years of age and you may legally adhere to this agreement.
          CalendarNotes.io assumes no responsibility for liabilities related to
          age misinterpretation.
        </p>
        <h2 style={{ fontSize: "2rem" }}>Intellectual Property</h2>
        <p style={{ fontWeight: 300 }}>
          You agree that all materials, products, and services provided on this
          website are the property of CalendarNotes.io, its affiliates,
          directors, officers, employees, agents, suppliers, or licensors
          including all copyrights, trade secrets, trademarks, patents, and
          other intellectual property. You also agree that you will not
          reproduce or redistribute CalendarNotes.io's intellectual property in
          any way, including electronic, digital, or new trademark
          registrations.
        </p>
        <p style={{ fontWeight: 300 }}>
          You grant CalendarNotes a royalty-free and non-exclusive license to
          display, use, copy, transmit, and broadcast the content you upload and
          publish. For issues regarding intellectual property claims, you should
          contact matt@calendarnotes.io in order to come to an agreement.
        </p>
        <h2 style={{ fontSize: "2rem" }}>User Accounts</h2>
        <p style={{ fontWeight: 300 }}>
          As a user of this website, you may be asked to register with us and
          provide private information. You are responsible for ensuring the
          accuracy of this information, and you are responsible for maintaining
          the safety and security of your identifying information. You are also
          responsible for all activities that occur under your account or
          password.
        </p>
        <p style={{ fontWeight: 300 }}>
          If you think there are any possible issues regarding the security of
          your account on the website, inform us immediately so we may address
          it accordingly.
        </p>
        <p style={{ fontWeight: 300 }}>
          We reserve all rights to terminate user accounts, edit or remove
          content, and cancel orders in their sole discretion.
        </p>
        <h2 style={{ fontSize: "2rem" }}>Applicable Law</h2>
        <p style={{ fontWeight: 300 }}>
          By visiting this website, you agree that the laws of the United
          States, without regard to principles of conflict laws, will govern
          these terms and conditions, or any dispute of any sort that might come
          between CalendarNotes and you, or its business partners and
          associates.
        </p>
        <h2 style={{ fontSize: "2rem" }}>Disputes</h2>
        <p style={{ fontWeight: 300 }}>
          Any dispute related in any way to your visit to this website or to
          products you purchase from us shall be arbitrated by state or federal
          courts and you consent to exclusive jurisdiction and venue of such
          courts.
        </p>
        <h2 style={{ fontSize: "2rem" }}>Idemnification</h2>
        <p style={{ fontWeight: 300 }}>
          You agree to indemnify CalendarNotes and its affiliates and hold
          CalendarNotes harmless against legal claims and demands that may arise
          from your use or misuse of our services. We reserve the right to
          select our own legal counsel.
        </p>
        <h2 style={{ fontSize: "2rem" }}>Limitation on Liability</h2>
        <p style={{ fontWeight: 300 }}>
          CalendarNotes is not liable for any damages that may occur to you as a
          result of your misuse of our website.
        </p>
        <p style={{ fontWeight: 300 }}>
          CalendarNotes reserves the right to edit, modify, and change this
          agreement at any time. We shall let our users know of these changes
          through electronic mail. This agreement is an understanding between
          CalendarNotes and the user, and this supersedes and replaces all prior
          agreements regarding the use of this website.
        </p>
        <p
          style={{
            fontStyle: "italic",
            fontSize: "1.05rem",
            marginTop: "3rem",
            fontWeight: 300,
          }}
        >
          These Terms of Service were last revised on 31 May 2021.
        </p>
      </div>
    </Layout>
  );
}
