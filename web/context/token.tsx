import React from "react";
import Cookies from "universal-cookie";

const Context = React.createContext(null);

const { Provider } = Context;

function TokenProvider({ children }) {
  const [token, setToken] = React.useState("");
  const cookies = new Cookies();

  React.useEffect(() => {
    const validateToken = async () => {
      if (typeof window !== "undefined") {
        const tokenInStorage = cookies.get("cnauthtkn");
        if (tokenInStorage) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/next/user`,
            { headers: { Authorization: `Bearer ${tokenInStorage}` } }
          );
          if (response.ok) {
            setToken(tokenInStorage);
          }
          if (!response.ok) {
            setToken("");
            cookies.remove("cnauthtkn");
          }
        }
      }
    };
    validateToken();
  });

  const value = { token, setToken };
  return <Provider value={value}>{children}</Provider>;
}

function useToken() {
  const { token, setToken } = React.useContext(Context);
  return { token, setToken };
}

export { TokenProvider, useToken };
