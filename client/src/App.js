import React, { useEffect, useState } from "react";
import UserContext from "./context/UserContext";
import Authenticate from "./components/Authenticate";

const App = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const getUserData = async () => {
      const res = await fetch("/api");
      const data = await res.json();
      setUserData(data);

      /**
       * @todo handle server errors
       */
    };
    getUserData();
  }, []);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {userData ? <Authenticate /> : <div>Loading...</div>}
    </UserContext.Provider>
  );
};

export default App;
