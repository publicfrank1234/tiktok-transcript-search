import React, { useState } from "react";
import "./SearchComponent.css";

const SearchComponent = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://ad2c01419149347cdb584072cb931bf8-524830316.us-west-2.elb.amazonaws.com/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          mode: "cors",
          credentials: "omit",
          body: JSON.stringify({ query }),
        }
      );

      if (!response.ok) {
        if (response.status === 0) {
          throw new Error(
            "Network error - Unable to reach the search service. Please try again later."
          );
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Search failed with status ${response.status}`
        );
      }

      const data = await response.json();
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid response format from server");
      }

      setResults(data.results);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for TikTok transcripts..."
          className="search-input"
          disabled={loading}
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {results.length === 0 && !loading && !error && (
        <div className="no-results">
          <p>No results found. Try a different search query.</p>
        </div>
      )}

      <div className="results-container">
        {results.map((result) => (
          <div key={result.id} className="result-card">
            <div className="video-preview">
              {result.s3_url ? (
                <video controls src={result.s3_url} className="video-player" />
              ) : result.tiktok_url ? (
                <iframe
                  src={result.tiktok_url}
                  className="video-player"
                  allowFullScreen
                />
              ) : (
                <div className="no-video">No video available</div>
              )}
            </div>
            <div className="result-content">
              <h3 className="result-title">{result.hook}</h3>
              <p className="result-text">{result.text}</p>
              <div className="result-metrics">
                <span title="Likes">👍 {result.likes.toLocaleString()}</span>
                <span title="Comments">
                  💬 {result.comments.toLocaleString()}
                </span>
                <span title="Shares">🔄 {result.shares.toLocaleString()}</span>
              </div>
              <div className="result-meta">
                <span>
                  Created: {new Date(result.create_time).toLocaleDateString()}
                </span>
                <span>
                  Scraped: {new Date(result.scrape_time).toLocaleDateString()}
                </span>
                <span>Score: {result.score.toFixed(3)}</span>
              </div>
              <div className="result-links">
                {result.tiktok_url && (
                  <a
                    href={result.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-button"
                  >
                    View on TikTok
                  </a>
                )}
                {result.youtube_url && result.youtube_url !== "None" && (
                  <a
                    href={result.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-button"
                  >
                    View on YouTube
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchComponent;
