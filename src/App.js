import { useState, useEffect } from "react";
import "./App.css";

import Header from "./components/Header";
import SearchSection from "./components/SearchSection";
import ResultHeader from "./components/ResultHeader";
import SortRow from "./components/SortRow";
import CommentList from "./components/CommentList";
import Page from "./components/Page";

function App() {
  const [username, setUsername] = useState("");
  const [searchedUsername, setSearchedUsername] = useState("");
  const [allComments, setAllComments] = useState([]);
  const [displayedComments, setDisplayedComments] = useState([]);
  const [blog, setBlog] = useState(null);

  const [scannedPosts, setScannedPosts] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanningMore, setIsScanningMore] = useState(false);
  const [currentBatchComments, setCurrentBatchComments] = useState(0);

  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const commentsPerPage = 20;

  useEffect(() => {
    if (allComments.length === 0) {
      setDisplayedComments([]);
      return;
    }

    const sorted = [...allComments].sort((a, b) => {
      if (sortBy === "date") {
        return sortDirection === "desc"
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date);
      }

      if (sortBy === "post") {
        if (a.postDate === b.postDate) {
          return new Date(a.date) - new Date(b.date);
        }

        return sortDirection === "desc"
          ? new Date(b.postDate) - new Date(a.postDate)
          : new Date(a.postDate) - new Date(b.postDate);
      }

      return 0;
    });

    setDisplayedComments(sorted);
    setCurrentPage(1);
  }, [allComments, sortBy, sortDirection]);

  const fetchComments = async (offsetToUse, shouldReplace, isLoadMore = false) => {
    try {
      setErrorMessage("");

      if (isLoadMore) {
        setIsScanningMore(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch(
          `https://tumblr-comment-tracker.onrender.com/api/comments/${encodeURIComponent(
          username
        )}?offset=${offsetToUse}&limit=50`
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message ||
            "Unable to retrieve comments for this blog. Double check that the blog exists and is not private. If everything looks correct, Tumblr's API may be temporarily unavailable. Please try again later."
        );

        setIsLoading(false);
        setIsScanningMore(false);
        return;
      }

      if (shouldReplace) {
        setSearchedUsername(data.searchedUsername);
        setBlog(data.blog);
        setAllComments(data.comments || []);
        setTotalPosts(data.totalPosts || 0);
        setScannedPosts(data.scannedPosts || 0);
      } else {
        setAllComments((prev) => [...prev, ...(data.comments || [])]);
        setScannedPosts(data.scannedPosts || 0);
      }

      setCurrentBatchComments(data.totalCommentsFound || data.comments?.length || 0);
      setNextOffset(data.nextOffset || 0);
      setHasMorePosts(data.hasMorePosts);
      setHasSearched(true);
      setIsLoading(false);
      setIsScanningMore(false);
    } catch (error) {
      console.error(error);

      setIsLoading(false);
      setIsScanningMore(false);

      setErrorMessage(
        "Unable to retrieve comments for this blog. Double check that the blog exists and is not private. If everything looks correct, Tumblr's API may be temporarily unavailable. Please try again later."
      );
    }
  };

  const handleSearch = () => {
    setErrorMessage("");

    if (username.trim() === "") {
      setErrorMessage("Please enter a Tumblr username first.");
      return;
    }

    setAllComments([]);
    setDisplayedComments([]);
    setBlog(null);
    setScannedPosts(0);
    setTotalPosts(0);
    setNextOffset(0);
    setHasMorePosts(false);
    setCurrentBatchComments(0);
    setCurrentPage(1);
    setHasSearched(false);
    setSortBy("date");
    setSortDirection("desc");

    fetchComments(0, true);
  };

  const handleScanNext = () => {
    fetchComments(nextOffset, false, true);
  };

  const handleSortClick = (selectedSort) => {
    if (sortBy === selectedSort) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortBy(selectedSort);
      setSortDirection("desc");
    }
  };

  const countTotalComments = (comments) => {
    let total = 0;

    const countRecursive = (commentList) => {
      commentList.forEach((comment) => {
        total++;

        if (comment.replies && comment.replies.length) {
          countRecursive(comment.replies);
        }
      });
    };

    countRecursive(comments);
    return total;
  };

  const totalCommentsFound = countTotalComments(allComments);

  const totalPages = Math.ceil(displayedComments.length / commentsPerPage);
  const startIndex = (currentPage - 1) * commentsPerPage;
  const pagedComments = displayedComments.slice(
    startIndex,
    startIndex + commentsPerPage
  );

  return (
    <main className="app-background">
      <section className="paper">
        <Header />

        <SearchSection
          username={username}
          setUsername={setUsername}
          handleSearch={handleSearch}
        />

        {errorMessage && (
          <section className="error-box">
            <strong>Search issue</strong>
            <p>{errorMessage}</p>
          </section>
        )}

        {(isLoading || isScanningMore) && (
          <section className="loading-box">
            <div>Searching @{username}...</div>

            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${
                    totalPosts > 0 ? (scannedPosts / totalPosts) * 100 : 0
                  }%`,
                }}
              ></div>
            </div>

            <div className="progress-text">
              {currentBatchComments > 0 &&
                ` • Found ${currentBatchComments} comments in this batch`}
            </div>

            <div className="loading-status">
              {isLoading ? "Loading posts..." : "Fetching comments from posts..."}
            </div>
          </section>
        )}

        {hasSearched && !isLoading && !isScanningMore && (
          <>
            <ResultHeader
              username={searchedUsername}
              totalComments={totalCommentsFound}
              blog={blog}
              scannedPosts={scannedPosts}
              scannedOriginalPosts={scannedPosts}
              totalPosts={totalPosts}
            />

            {allComments.length > 0 && (
              <SortRow
                sortBy={sortBy}
                sortDirection={sortDirection}
                handleSortClick={handleSortClick}
              />
            )}

            <CommentList comments={pagedComments} />

            {hasMorePosts && (
              <div className="scan-more-row">
                <button onClick={handleScanNext} disabled={isScanningMore}>
                  {isScanningMore
                    ? "Scanning more posts..."
                    : `Load More Posts (${scannedPosts}/${totalPosts} scanned)`}
                </button>
              </div>
            )}

            {!hasMorePosts && allComments.length > 0 && (
              <div className="scan-complete-message">
                ✓ Complete! Scanned all {scannedPosts} posts and found{" "}
                {totalCommentsFound} comments
              </div>
            )}

            {displayedComments.length > commentsPerPage && (
              <Page
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default App;