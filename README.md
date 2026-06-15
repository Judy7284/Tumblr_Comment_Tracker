# Tumblr Comment Tracker

Tumblr Comment Tracker is a web application that help user have a easy way to find and organize comments that are left on a accounts post, by scanning all the post on a tumblr blog and through the available not data gathers the comment and replies before organizing them for easy access.

## Why I Built This

As a tumblr user accessing the comment left on my post has always been annoying since tumblr doesnt really have a built in featire for that. You can search through your activity and filter by people leaving comments on your post but those comment often dissappear after a certain amount of time, so whenever I want to look at the comments left on my post my only choice was to go through all my post one by one to see them. When you only have 5 post it's not that big of a deal but when you have over 50 suddenly it gets very very tedious, which is why I made this web application so I can look up all the coment easily in one place.

This project was also an opportunity to gain experience working with third-party APIs, OAuth authentication, React state management, and backend data processing.

## Features

### Search Tumblr blogs

Enter a Tumblr username or blog URL and scan posts from that blog.

### Comment aggregation

Collect comments and replies from scanned Tumblr posts and display them in a centralized feed.

### Sort comments

Sort results by date or by the post they belong to.

### Pagination

Large result sets are split into pages to improve performance and navigation.

### Incremental scanning

Scan posts in batches and load more posts when needed rather than processing an entire blog at once.

### Responsive interface

Works across desktop and mobile screen sizes.

## Tech Stack

### Frontend

* React
* JavaScript
* CSS

### Backend

* Node.js
* Express
* Axios

### APIs & Authentication

* Tumblr API
* OAuth 1.0 Authentication

## How It Works

1. The user enters a Tumblr username.
2. The frontend sends a request to the backend API.
3. The backend authenticates with Tumblr using OAuth credentials.
4. Tumblr blog information and posts are retrieved.
5. Available comment and reply data is processed.
6. Comments are organized into threaded discussions.
7. The frontend displays results with sorting and pagination options.

## Installation and Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/tumblr-comment-tracker.git
cd tumblr-comment-tracker
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` folder.

```env
TUMBLR_API_KEY=your_api_key
TUMBLR_OAUTH_SECRET=your_oauth_secret
TUMBLR_OAUTH_TOKEN=your_oauth_token
TUMBLR_ACCESS_TOKEN_SECRET=your_access_token_secret
```

### 5. Start the backend

```bash
cd server
node index.js
```

### 6. Start the frontend

```bash
npm start
```

The application should now be available locally.

## Usage

1. Start the frontend and backend servers.
2. Enter a Tumblr username.
3. Click **Search**.
4. Browse discovered comments and replies.
5. Sort results by date or post.
6. Load additional posts if more content is available.

## Example Use Case

A Tumblr user wants to see all discussion activity on a favorite blog without opening dozens of individual posts.

Instead of manually searching through posts:

* Enter the blog username.
* Scan available posts.
* View comments from multiple posts in one location.
* Follow reply chains through nested discussions.
* Sort activity chronologically.

## Project Structure

```text
tumblr-comment-tracker/
├── public/
├── src/
│   ├── components/
│   │   ├── CommentCard.js
│   │   ├── CommentList.js
│   │   ├── Header.js
│   │   ├── Page.js
│   │   ├── ResultHeader.js
│   │   ├── SearchSection.js
│   │   └── SortRow.js
│   ├── App.js
│   └── index.js
│
├── server/
│   ├── index.js
│   ├── get_token.js
│   ├── package.json
│   └── .env
│
├── package.json
├── README.md
└── .gitignore
```

## Current Status

Current functionality includes:

* Tumblr blog searching
* OAuth authentication
* Comment and reply extraction
* Nested comment display
* Sorting options
* Pagination
* Batch scanning
* Responsive UI

## Future Improvements

* Save previous searches
* Export comments to CSV
* Advanced filtering by user or keyword
* Search within comments
* Improved Tumblr note parsing
* Comment analytics and statistics
* User accounts and saved dashboards
* Cloud deployment

## What I Learned

Building Tumblr Comment Tracker helped me gain hands-on experience with React component architecture, Express API development, OAuth authentication flows, third-party API integration, recursive data structures for nested replies, state management, pagination, and processing large datasets in a user-friendly way.

It also strengthened my understanding of how frontend and backend systems communicate, how APIs are authenticated, and how to organize complex data into a clean user experience.
