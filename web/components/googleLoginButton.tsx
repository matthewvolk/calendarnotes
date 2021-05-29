import styles from "../styles/googleLoginButton.module.css";

export default function GoogleLoginButton() {
  const logInWithGoogle = (e) => {
    e.preventDefault();
    window.location.assign(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/google`
    );
  };
  return (
    <button className={styles.button} onClick={logInWithGoogle}>
      Click Here to log in with Google
    </button>
  );
}
