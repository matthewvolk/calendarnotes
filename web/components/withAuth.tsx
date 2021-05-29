import { useRouter } from "next/router";
import { useSaveTokenFromQueryParams } from "../auth/useSaveTokenFromQueryParams";

const withAuth = (WrappedComponent) => {
  return (props) => {
    if (typeof window !== "undefined") {
      useSaveTokenFromQueryParams();
      const Router = useRouter();

      const accessToken = localStorage.getItem("cnauthtkn");

      // If there is no token we redirect to "/login" page.
      if (!accessToken) {
        Router.push("/login");
        return null;
      }

      // If this is an accessToken we just render the component that was passed with all its props
      return <WrappedComponent {...props} />;
    }

    // If we are on server, return null
    console.log("Window does not exist");
    return null;
  };
};

export default withAuth;
