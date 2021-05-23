import { useRouter } from "next/router";

export const useSaveTokenFromQueryParams = () => {
  const { query, asPath, push } = useRouter();
  const tokenKey = "token";

  let queryValue =
    query[tokenKey] || asPath.match(new RegExp(`[&?]${tokenKey}=(.*)(&|$)`));

  if (asPath.match(new RegExp(`[&?]${tokenKey}=(.*)(&|$)`))) {
    queryValue = queryValue[1].slice(0, -1);
  }

  if (typeof queryValue === "string" && queryValue) {
    localStorage.setItem("cnauthtkn", queryValue);
    push("/dashboard");
  }
};
