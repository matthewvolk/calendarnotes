import React, { Component } from "react";
import logo from "./logo.svg";
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

  render() {
    const { data } = this.state;
    console.log(data);

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h3 style={{ margin: "0.25rem 0 1rem 0" }}>{data.name}</h3>
          <pre style={{ margin: "0 0 0.25rem 0", fontSize: "1.15rem" }}>
            v{data.version}
          </pre>
          <pre style={{ margin: "0", fontSize: "1.15rem" }}>
            Author: {data.author}
          </pre>
          <pre style={{ marginTop: "0.5rem", fontSize: "1.15rem" }}>
            logged_in: {data.logged_in}
          </pre>
        </header>
      </div>
    );
  }
}

export default App;
