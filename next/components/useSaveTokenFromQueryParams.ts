import { useRouter } from "next/router";

export const useSaveTokenFromQueryParams = () => {
  const { query, push } = useRouter();
  if (typeof query.token === "string" && query.token) {
    localStorage.setItem("token", query.token);
    push("/dashboard");
  }
};
