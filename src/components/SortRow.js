function SortRow({ sortBy, sortDirection, handleSortClick }) {
  return (
    <section className="sort-row">
      <span>Sort by:</span>

      <button
        className={sortBy === "date" ? "active" : ""}
        onClick={() => handleSortClick("date")}
      >
        Date {sortBy === "date" && (sortDirection === "desc" ? "↓" : "↑")}
      </button>

      <button
        className={sortBy === "post" ? "active" : ""}
        onClick={() => handleSortClick("post")}
      >
        Post {sortBy === "post" && (sortDirection === "desc" ? "↓" : "↑")}
      </button>
    </section>
  );
}

export default SortRow;