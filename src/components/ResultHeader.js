function ResultHeader({
  username,
  totalComments,
  blog,
  scannedPosts,
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
        <p>Comments Found: {totalComments}</p>
      </div>
    </section>
  );
}

export default ResultHeader;