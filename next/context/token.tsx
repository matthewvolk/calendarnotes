import React from "react";

const TokenContext = React.createContext(null);

function TokenProvider({ children }) {
  const [token, setToken] = React.useState("");

  React.useEffect(() => {
    (function () {
      if (typeof window !== "undefined") {
        const tokenInStorage = localStorage.getItem("token");
        if (tokenInStorage) {
          setToken(tokenInStorage);
        }
      }
    })();
    // need to clear token state when user logs out
  });

  return (
    <TokenContext.Provider value={token}>{children}</TokenContext.Provider>
  );
}

function useToken() {
  const token = React.useContext(TokenContext);
  return { token };
}

export { TokenProvider, useToken };
