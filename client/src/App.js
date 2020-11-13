import React, { Component } from "react";
import "./App.css";

class App extends Component {
  state = { data: {} };

  componentDidMount() {
    this.getMessage();
  }

  getMessage = () => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => this.setState({ data }));
  };

  logInWithGoogle = (e) => {
    e.preventDefault();
    window.location.assign("/api/google/auth");
  };

  render() {
    const { data } = this.state;
    console.log(data);

    return (
      <div className="App">
        <header className="App-header">
          <h1
            style={{ fontSize: "5.25rem", marginTop: "0", marginBottom: "0" }}
          >
            🗓
          </h1>
          <h3 style={{ margin: "1rem 0 1rem 0" }}>{data.name}</h3>
          <pre style={{ margin: "0", fontSize: "1.15rem" }}>
            v{data.version}
          </pre>
          <pre style={{ margin: "0", fontSize: "1.15rem" }}>
            logged_in: {data.logged_in ? "true" : "false"}
          </pre>
          {data.logged_in ? (
            <pre style={{ margin: "0", fontSize: "1.15rem" }}>
              user: {data.user.firstName} {data.user.lastName}
            </pre>
          ) : null}
          <button
            onClick={this.logInWithGoogle}
            type="button"
            class="login-with-google-btn"
          >
            Sign in with Google
          </button>
        </header>
      </div>
    );
  }
}

export default App;
