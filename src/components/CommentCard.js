function CommentCard({ comment, isReply = false }) {
  return (
    <article className={`comment-card ${isReply ? 'reply-comment' : ''}`}>
      <div className="stamp">
        <span>{comment.avatarLetter}</span>
      </div>

      <div className="comment-content">
        <div className="comment-top">
          <div>
            <h3>{comment.username}</h3>
            <p>
              on: <a href={comment.postUrl} target="_blank" rel="noopener noreferrer">{comment.postTitle}</a>
            </p>
          </div>

          <p className="date">{new Date(comment.date).toLocaleString()}</p>
        </div>

        <p className="comment-text">"{comment.text}"</p>

        {comment.replies && comment.replies.length > 0 && (
          <section className="replies">
            {comment.replies.map((reply) => (
              <CommentCard key={reply.id} comment={reply} isReply={true} />
            ))}
          </section>
        )}

        <div className="comment-bottom">
          <a href={comment.postUrl} target="_blank" rel="noopener noreferrer">View Post →</a>
        </div>
      </div>
    </article>
  );
}

export default CommentCard;