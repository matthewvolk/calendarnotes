import { useRouter } from "next/router";

export const useSaveTokenFromQueryParams = () => {
  const { query, asPath, push } = useRouter();
  const tokenKey = "token";

  let queryValue =
    query[tokenKey] || asPath.match(new RegExp(`[&?]${tokenKey}=(.*)(&|$)`));

  if (asPath.match(new RegExp(`[&?]${tokenKey}=(.*)(&|$)`))) {
    queryValue = queryValue[1].replace(/\#$/, "");
  }

  if (typeof queryValue === "string" && queryValue) {
    console.log(localStorage.getItem("cnauthtkn"));
    if (localStorage.getItem("cnauthtkn")) {
      localStorage.removeItem("cnauthtkn");
    }
    localStorage.setItem("cnauthtkn", queryValue);
    push("/dashboard");
  }
};
