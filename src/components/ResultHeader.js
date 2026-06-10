function ResultHeader({
  username,
  totalComments,
  blog,
  scannedPosts,
  scannedOriginalPosts,
}) {
  return (
    <section className="result-header">
      <div className="blog-info">
        {blog?.avatar && <img src={blog.avatar} alt={`${username} avatar`} />}

        <div>
          <p className="result-label">Results for</p>
          <h2>@{username}</h2>
          <p>{blog?.title}</p>
        </div>
      </div>

      <div className="scan-stats">
        <p>Total Posts: {blog?.totalPosts || 0}</p>
        <p>Scanned Posts: {scannedPosts}</p>
        <p>Original Posts Scanned: {scannedOriginalPosts}</p>
        <p>Comments Found: {totalComments}</p>
      </div>
    </section>
  );
}

export default ResultHeader;