require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

const TUMBLR_API_KEY = process.env.TUMBLR_API_KEY;
const TUMBLR_OAUTH_SECRET = process.env.TUMBLR_OAUTH_SECRET;
const TUMBLR_OAUTH_TOKEN = process.env.TUMBLR_OAUTH_TOKEN;
const TUMBLR_ACCESS_TOKEN_SECRET = process.env.TUMBLR_ACCESS_TOKEN_SECRET;

console.log("Tumblr API key loaded:", !!TUMBLR_API_KEY);
console.log("Tumblr OAuth secret loaded:", !!TUMBLR_OAUTH_SECRET);
console.log("Tumblr OAuth token loaded:", !!TUMBLR_OAUTH_TOKEN);
console.log("Tumblr access token secret loaded:", !!TUMBLR_ACCESS_TOKEN_SECRET);

app.use(cors());
app.use(express.json());

function createOAuth() {
  return OAuth({
    consumer: {
      key: TUMBLR_API_KEY,
      secret: TUMBLR_OAUTH_SECRET,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });
}

function getOAuthHeaders(url, method = "GET", data = {}) {
  const oauth = createOAuth();

  const token = {
    key: TUMBLR_OAUTH_TOKEN,
    secret: TUMBLR_ACCESS_TOKEN_SECRET,
  };

  return oauth.toHeader(
    oauth.authorize(
      {
        url,
        method,
        data,
      },
      token
    )
  );
}

function cleanTumblrUsername(input) {
  return input
    .replace("https://www.tumblr.com/blog/", "")
    .replace("https://", "")
    .replace("http://", "")
    .replace(".tumblr.com", "")
    .replace("@", "")
    .trim()
    .toLowerCase();
}

function extractCommentsWithReplies(notes, post, postId) {
  const commentsMap = new Map();
  const topLevelComments = [];

  notes.forEach((note, index) => {
    if (note.type !== "reply") return;

    const commentId = note.comment_id || note.id || `${postId}-${index}`;
    const parentId = note.reply_to_comment_id || note.reply_to_id || null;

    const comment = {
      id: commentId,
      username: note.blog_name || "unknown-user",
      avatarLetter: note.blog_name ? note.blog_name[0].toUpperCase() : "?",
      text: note.reply_text || note.text || "",
      date: note.timestamp
        ? new Date(note.timestamp * 1000).toISOString()
        : new Date(post.timestamp * 1000).toISOString(),
      postTitle: post.title || post.summary || "Untitled Post",
      postDate: new Date(post.timestamp * 1000).toISOString(),
      postUrl: post.post_url,
      parentId,
      replies: [],
    };

    if (comment.text.trim() === "") return;

    commentsMap.set(commentId, comment);

    if (parentId && commentsMap.has(parentId)) {
      commentsMap.get(parentId).replies.push(comment);
    } else {
      topLevelComments.push(comment);
    }
  });

  function sortReplies(comments) {
    comments.forEach((comment) => {
      if (comment.replies.length > 0) {
        comment.replies.sort((a, b) => new Date(a.date) - new Date(b.date));
        sortReplies(comment.replies);
      }
    });
  }

  sortReplies(topLevelComments);
  topLevelComments.sort((a, b) => new Date(a.date) - new Date(b.date));

  return topLevelComments;
}

app.get("/api/comments/:username", async (req, res) => {
  try {
    const username = cleanTumblrUsername(req.params.username);
    const offset = Number(req.query.offset) || 0;
    const limit = Math.min(Number(req.query.limit) || 50, 50);

    console.log(`\n=== Scanning ${username} ===`);
    console.log(`Posts offset: ${offset}, limit: ${limit}`);

    const infoUrl = `https://api.tumblr.com/v2/blog/${username}.tumblr.com/info`;
    const infoHeaders = getOAuthHeaders(infoUrl);

    const infoResponse = await axios.get(infoUrl, {
      headers: infoHeaders,
    });

    const blog = infoResponse.data.response?.blog;

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found.",
        comments: [],
      });
    }

    const totalPosts = blog.posts || 0;

    console.log(`Blog: ${blog.title}, Total posts: ${totalPosts}`);

    const postsUrl = `https://api.tumblr.com/v2/blog/${username}.tumblr.com/posts`;

    const postsParams = {
      limit,
      offset,
      notes_info: true,
    };

    const postsHeaders = getOAuthHeaders(postsUrl, "GET", postsParams);

    const postsResponse = await axios.get(postsUrl, {
      params: postsParams,
      headers: postsHeaders,
    });

    const posts = postsResponse.data.response?.posts || [];
    const allComments = [];

    console.log(`Fetched ${posts.length} posts for this batch`);

    for (const post of posts) {
      console.log(`Processing post ${post.id}`);
      console.log(`Note count: ${post.note_count || 0}`);

      if (post.notes && post.notes.length > 0) {
        console.log(`Found ${post.notes.length} notes directly on post`);

        const comments = extractCommentsWithReplies(post.notes, post, post.id);
        allComments.push(...comments);

        console.log(`Found ${comments.length} top-level comments`);
      } else {
        console.log("No notes returned for this post");
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    function countComments(comment) {
      let total = 1;

      if (comment.replies && comment.replies.length > 0) {
        total += comment.replies.reduce((sum, reply) => {
          return sum + countComments(reply);
        }, 0);
      }

      return total;
    }

    const totalComments = allComments.reduce((sum, comment) => {
      return sum + countComments(comment);
    }, 0);

    console.log("\n=== Summary for this batch ===");
    console.log(`Posts scanned: ${posts.length}`);
    console.log(`Top-level comment threads: ${allComments.length}`);
    console.log(`Total individual comments: ${totalComments}`);

    res.json({
      searchedUsername: username,
      nextOffset: offset + limit,
      hasMorePosts: offset + limit < totalPosts,
      blog: {
        title: blog.title || username,
        name: blog.name || username,
        avatar: `https://api.tumblr.com/v2/blog/${username}.tumblr.com/avatar/128`,
        totalPosts,
      },
      scannedPosts: offset + posts.length,
      totalPosts,
      postsInThisBatch: posts.length,
      comments: allComments,
      totalCommentsFound: totalComments,
    });
  } catch (error) {
    console.error("Error:", error.message);

    if (error.response) {
      console.error("API Response:", error.response.data);
    }

    res.status(500).json({
      message: "Something went wrong, please make sure that the blog exists and it;s setting is not set to hidden from web. If error still persist Tumblr's API may be temporarily unavailable, please try again later.",
      error: error.message,
      comments: [],
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});