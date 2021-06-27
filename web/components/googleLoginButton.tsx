import styles from "../styles/googleLoginButton.module.css";

export default function GoogleLoginButton() {
  const logInWithGoogle = (e) => {
    e.preventDefault();
    window.location.assign(
      `${process.env.NEXT_PUBLIC_API_URL}/api/next/google`
    );
  };
  return (
    <div
      onClick={logInWithGoogle}
      className={`${styles.gButton} ${styles.normal}`}
      role="login button"
    >
      <img
        className={`${styles.logoTile}`}
        src="/btn_google_dark_normal_ios.svg"
      />
      <span>Sign in with Google</span>
    </div>
  );
}
