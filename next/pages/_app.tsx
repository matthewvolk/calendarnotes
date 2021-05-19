import { TokenProvider } from "../context/token";
import { UserProvider } from "../context/user";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <TokenProvider>
      <UserProvider>
        <Component {...pageProps} />
      </UserProvider>
    </TokenProvider>
  );
}

export default MyApp;
