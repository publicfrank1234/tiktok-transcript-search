import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./SearchComponent.css";

const VideoPreview = ({ result }) => {
  if (result.tiktok_url) {
    // Extract video ID from TikTok URL
    const videoId = result.tiktok_url.split("/video/")[1]?.split("?")[0];
    if (!videoId)
      return (
        <div className="video-preview">
          <div className="no-video">Invalid TikTok URL</div>
        </div>
      );

    return (
      <div className="video-preview">
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoId}?lang=en-US`}
          className="video-player"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          frameBorder="0"
          title="TikTok video player"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
    );
  }

  return (
    <div className="video-preview">
      <div className="no-video">No preview available</div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Render modal outside the main component hierarchy
  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

const ResultText = ({ text, hook }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (e) => {
    e.stopPropagation(); // Stop event from bubbling up
    setIsModalOpen(true);
  };

  return (
    <div className="result-text-container">
      <p className="result-text">{text}</p>
      <button className="toggle-text-button" onClick={handleOpenModal}>
        Read Full Transcript
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="transcript-modal">
          <h2>{hook}</h2>
          <p>{text}</p>
        </div>
      </Modal>
    </div>
  );
};

const SearchComponent = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalResults, setTotalResults] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const handleSearch = async (e, page = 1) => {
    e?.preventDefault(); // Make preventDefault optional for pagination clicks
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://video-search.sitepilot.online/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            page: page,
            page_size: pageSize,
          }),
        }
      );

      if (!response.ok) {
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
      setTotalResults(data.total_results);
      setCurrentPage(data.current_page);
      setHasNext(data.has_next);
      setHasPrevious(data.has_previous);
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message);
      setResults([]);
      setHasNext(false);
      setHasPrevious(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1) {
      handleSearch(null, newPage);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={(e) => handleSearch(e, 1)} className="search-form">
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
            <VideoPreview result={result} />
            <div className="result-content">
              <h3 className="result-title">{result.hook}</h3>
              <ResultText text={result.text} hook={result.hook} />
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
                {result.s3_url && (
                  <a
                    href={result.s3_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-button"
                    title="Requires access permissions"
                  >
                    Download MP4
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

      {results.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevious || loading}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {Math.ceil(totalResults / pageSize)}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext || loading}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
