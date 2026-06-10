function SearchSection({ username, setUsername, handleSearch }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <form className="search-section" onSubmit={handleSubmit}>
      <input
        placeholder="Enter Tumblr username..."
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <button type="submit">Search</button>
    </form>
  );
}

export default SearchSection;