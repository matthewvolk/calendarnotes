import { TokenProvider } from "../context/token";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <TokenProvider>
      <Component {...pageProps} />
    </TokenProvider>
  );
}

export default MyApp;
