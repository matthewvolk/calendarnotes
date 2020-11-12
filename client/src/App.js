import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

class App extends Component {
  state = { msg: null };

  componentDidMount() {
    this.getMessage();
  }

  getMessage = () => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => this.setState({ msg: data.msg }));
  };

  render() {
    const { msg } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>{msg}</p>
        </header>
      </div>
    );
  }
}

export default App;
