import React from "react";
import "./App.css";
import SearchComponent from "./SearchComponent";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>TikTok Transcript Search</h1>
        <p>Search through TikTok video transcripts using natural language</p>
      </header>
      <main>
        <SearchComponent />
      </main>
    </div>
  );
}

export default App;
