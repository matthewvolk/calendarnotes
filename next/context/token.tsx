import React from "react";

const TokenContext = React.createContext(null);

function TokenProvider({ children }) {
  const [token, setToken] = React.useState("");

  React.useEffect(() => {
    (function () {
      if (typeof window !== "undefined") {
        const tokenInStorage = localStorage.getItem("cnauthtkn");
        if (tokenInStorage) {
          setToken(tokenInStorage);
        }
      }
    })();
    // need to clear token state when user logs out
  });

  const value = { token, setToken };
  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
}

function useToken() {
  const { token, setToken } = React.useContext(TokenContext);
  return { token, setToken };
}

export { TokenProvider, useToken };
