require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 5000;

const TUMBLR_API_KEY = process.env.TUMBLR_API_KEY;

app.use(cors());
app.use(express.json());

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

async function fetchAllNotesForPost(blogName, postId, apiKey) {
  let allNotes = [];
  let offset = 0;
  const limit = 50;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const notesUrl = `https://api.tumblr.com/v2/blog/${blogName}.tumblr.com/notes`;
      const response = await axios.get(notesUrl, {
        params: {
          api_key: apiKey,
          id: postId,
          limit: limit,
          offset: offset,
          mode: "conversation"  
        }
      });
      
      const notes = response.data.response?.notes || [];
      allNotes = [...allNotes, ...notes];
      
      const totalNotes = response.data.response?.total_notes_count || 0;
      hasMore = allNotes.length < totalNotes && notes.length === limit;
      offset += limit;
      
      if (hasMore) await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error fetching notes for post ${postId}:`, error.message);
      break;
    }
  }
  
  return allNotes;
}

function extractCommentsWithReplies(notes, post, postId) {
  const commentsMap = new Map();
  const topLevelComments = [];
  
  notes.forEach((note, index) => {
    if (note.type === "reply") {
      const commentId = note.comment_id || note.id || `${postId}-${index}`;
      const parentId = note.reply_to_comment_id || note.reply_to_id || null;
      
      const comment = {
        id: commentId,
        username: note.blog_name || "unknown-user",
        avatarLetter: note.blog_name ? note.blog_name[0].toUpperCase() : "?",
        text: note.reply_text || "",
        date: note.timestamp ? new Date(note.timestamp * 1000).toISOString() : new Date(post.timestamp * 1000).toISOString(),
        postTitle: post.title || post.summary || "Untitled Post",
        postDate: new Date(post.timestamp * 1000).toISOString(),
        postUrl: post.post_url,
        parentId: parentId,
        replies: []
      };
      
      if (comment.text.trim() !== "") {
        commentsMap.set(commentId, comment);
        
        if (parentId && commentsMap.has(parentId)) {
          if (!commentsMap.get(parentId).replies) {
            commentsMap.get(parentId).replies = [];
          }
          commentsMap.get(parentId).replies.push(comment);
        } else if (!parentId) {
          topLevelComments.push(comment);
        }
      }
    }
  });
  
  const sortReplies = (comments) => {
    comments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => new Date(a.date) - new Date(b.date));
        sortReplies(comment.replies);
      }
    });
  };
  
  sortReplies(topLevelComments);
  
  topLevelComments.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return topLevelComments;
}

app.get("/api/comments/:username", async (req, res) => {
  try {
    const username = cleanTumblrUsername(req.params.username);
    const offset = Number(req.query.offset) || 0;
    const limit = Math.min(Number(req.query.limit) || 20, 20);
    
    console.log(`\n=== Scanning ${username} ===`);
    console.log(`Posts offset: ${offset}, limit: ${limit}`);

    const infoUrl = `https://api.tumblr.com/v2/blog/${username}.tumblr.com/info?api_key=${TUMBLR_API_KEY}`;
    const infoResponse = await axios.get(infoUrl);
    
    if (!infoResponse.data.response?.blog) {
      return res.status(404).json({
        message: "Blog not found",
        comments: []
      });
    }

    const blog = infoResponse.data.response.blog;
    const totalPosts = blog.posts || 0;
    console.log(`Blog: ${blog.title}, Total posts: ${totalPosts}`);

    const postsUrl = `https://api.tumblr.com/v2/blog/${username}.tumblr.com/posts`;
    const postsResponse = await axios.get(postsUrl, {
      params: {
        api_key: TUMBLR_API_KEY,
        limit: limit,
        offset: offset,
        reblog_info: false
      }
    });

    const posts = postsResponse.data.response?.posts || [];
    console.log(`Fetched ${posts.length} posts for this batch`);
    
    const allComments = [];
    let postsProcessed = 0;
    
    for (const post of posts) {
      postsProcessed++;
      console.log(`\n[${postsProcessed}/${posts.length}] Processing post ${post.id}...`);
      console.log(`  Title: ${post.title || "Untitled"}`);
      console.log(`  Note count: ${post.note_count || 0}`);
      
      if (post.note_count > 0) {
        console.log(`  Fetching notes for this post...`);
        
        const allNotes = await fetchAllNotesForPost(username, post.id, TUMBLR_API_KEY);
        console.log(`  Retrieved ${allNotes.length} total notes`);
        
        const postComments = extractCommentsWithReplies(allNotes, post, post.id);
        console.log(`  Found ${postComments.length} top-level comments with their replies`);
        
        allComments.push(...postComments);
      } else {
        console.log(`  No notes found for this post`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const totalComments = allComments.reduce((sum, comment) => {
      const countReplies = (c) => {
        let total = 1;
        if (c.replies && c.replies.length) {
          total += c.replies.reduce((acc, reply) => acc + countReplies(reply), 0);
        }
        return total;
      };
      return sum + countReplies(comment);
    }, 0);

    console.log(`\n=== Summary for this batch ===`);
    console.log(`Posts scanned: ${posts.length}`);
    console.log(`Top-level comment threads: ${allComments.length}`);
    console.log(`Total individual comments (including replies): ${totalComments}`);

    res.json({
      searchedUsername: username,
      nextOffset: offset + limit,
      hasMorePosts: offset + limit < totalPosts,
      blog: {
        title: blog.title || username,
        name: blog.name || username,
        avatar: `https://api.tumblr.com/v2/blog/${username}.tumblr.com/avatar/128`,
        totalPosts: totalPosts,
      },
      scannedPosts: offset + posts.length,
      totalPosts: totalPosts,
      postsInThisBatch: posts.length,
      comments: allComments,
      totalCommentsFound: totalComments
    });
    
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
    res.status(500).json({
      message: "Something went wrong while fetching Tumblr comments.",
      error: error.message,
      comments: [],
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});