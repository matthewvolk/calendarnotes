import React from "react";
import Loading from "react-spinners/GridLoader";

const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [state, setState] = React.useState({
    status: "pending",
    error: null,
    user: null,
  });
  React.useEffect(() => {
    /**
     * @todo Setup process.env.API_URL
     */
    fetch("/api/user", { credentials: "include" })
      .then((response) => {
        if (response.status === 401) {
          setState({ status: "success", error: null, user: null });
        } else {
          return response.json();
        }
      })
      .then((user) => setState({ status: "success", error: null, user }))
      .catch((error) => setState({ status: "error", error, user: null }));
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {state.status === "pending" ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            backgroundColor: "#DD4339",
          }}
        >
          <Loading color="#ffffff" />
        </div>
      ) : state.status === "error" ? (
        <div>
          Error!
          <div>
            <pre>{state.error.message}</pre>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

// useAuthState can only be called from within <AuthProvider />
function useAuthState() {
  const state = React.useContext(AuthContext);
  const isPending = state.status === "pending";
  const isError = state.status === "error";
  const isSuccess = state.status === "success";
  const isAuthenticated = state.user && isSuccess;
  return {
    ...state,
    isPending,
    isError,
    isSuccess,
    isAuthenticated,
  };
}

export { AuthProvider, useAuthState };
