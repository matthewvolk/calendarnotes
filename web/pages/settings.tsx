import { useEffect, useState } from "react";
import authFetch from "../utils/authFetch";
import Cookies from "universal-cookie";
import Head from "next/head";
import Link from "next/link";

function Settings({ user }) {
  return (
    <>
      <Head>
        <title>CalendarNotes - Settings</title>
      </Head>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "800px",
          margin: "5rem auto",
        }}
      >
        <div style={{ display: "flex" }}>
          <img
            src={user.picture}
            alt="Your Profile Picture"
            height="100"
            width="100"
            style={{
              borderRadius: "100%",
              margin: "0 1rem",
            }}
          />
          <h1
            style={{
              fontSize: "3rem",
              marginLeft: "2rem",
            }}
          >
            Settings
          </h1>
        </div>
        <Link href="/dashboard">
          <a style={{ textDecoration: "underline", color: "gray" }}>
            Back to Dashboard &raquo;
          </a>
        </Link>
      </div>
      <div
        style={{
          maxWidth: "800px",
          margin: "5rem auto",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "5rem", margin: "10rem 0 2rem 0" }}>🚧</div>
        <code
          style={{
            color: "#8A6534",
            padding: "4px",
            backgroundColor: "#FFF4DB",
            fontSize: "1.65rem",
            borderRadius: "4px",
          }}
        >
          Under Construction
        </code>
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx) => {
  const cookies = new Cookies(ctx.req ? ctx.req.headers.cookie : null);
  const { token: queryToken } = ctx.query;
  if (queryToken) {
    ctx.res.setHeader("set-cookie", `cnauthtkn=${queryToken}`);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/user`,
      {
        headers: {
          Authorization: `Bearer ${queryToken}`,
        },
      }
    );
    if (!response.ok) {
      return {
        redirect: {
          permanent: false,
          destination: "/login",
        },
      };
    }
    const data = await response.json();
    return {
      props: {
        token: queryToken,
        user: data,
      }, // will be passed to the page component as props
    };
  }
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
    if (!response.ok) {
      return {
        redirect: {
          permanent: false,
          destination: "/login",
        },
      };
    }
    const data = await response.json();
    return {
      props: {
        token: cnauthtkn,
        user: data,
      }, // will be passed to the page component as props
    };
  }
  return {
    redirect: {
      permanent: false,
      destination: "/login",
    },
  };
};

export default Settings;
