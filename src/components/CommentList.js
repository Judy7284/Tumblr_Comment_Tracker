import CommentCard from "./CommentCard";

function CommentList({ comments }) {
  if (comments.length === 0) {
    return (
      <section className="comments-list">
        <div className="no-comments">
          <p>✨ No comments found on this blog's posts yet.</p>
          <p>Try searching another blog or scan more posts!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="comments-list">
      {comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </section>
  );
}

export default CommentList;