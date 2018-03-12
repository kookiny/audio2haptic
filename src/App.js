import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import AudioAnalyzer from "./utils/AudioAnalyzer";

class App extends Component {
    componentDidMount(){
        this.anal = new AudioAnalyzer();
    }


  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
            <canvas id="ampcanvas" width="1000" height="130" ></canvas>
            <canvas id="chkcanvas" width="1000" height="100" ></canvas>
            <canvas id="vibecanvas" width="500" height="360"></canvas>
        </p>
      </div>
    );
  }
}

export default App;
