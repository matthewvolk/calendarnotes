import React from "react";
import { useToken } from "./token";

const UserContext = React.createContext(null);

function UserProvider({ children }) {
  const { token } = useToken();
  const [user, setUser] = React.useState({
    loading: true,
    error: false,
    user: null,
  });

  React.useEffect(() => {
    if (token) {
      fetch("https://localhost:8443/api/user/next", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((userData) => {
          setUser({
            loading: false,
            error: false,
            user: userData,
          });
        });
    }

    if (!token) {
      setUser({
        loading: false,
        error: false,
        user: null,
      });
    }
  }, [token]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

function useUser() {
  const user = React.useContext(UserContext);
  return user;
}

export { UserProvider, useUser };
