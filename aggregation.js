require('dotenv').config();
const dns = require('dns');
const mongoose = require('mongoose');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

dns.setServers(['1.1.1.1', '8.8.8.8']);

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Missing MONGODB_URI in your .env file');
  process.exit(1);
}

async function main() {
  await mongoose.connect(uri);
  console.log('Connected to Atlas');

  const pipeline = [
    { $match: {} },
    {
      $group: {
        _id: '$postId',
        commentCount: { $sum: 1 },
      },
    },
    { $sort: { commentCount: -1 } },
  ];

  const results = await Comment.aggregate(pipeline);
  console.log('\n--- Comment count per post (highest engagement first) ---');
  console.log(results);

  console.log('\n--- Same results, with post titles ---');
  for (const r of results) {
    const post = await Post.findById(r._id);
    console.log(`${post ? post.title : '(deleted post)'}: ${r.commentCount} comments`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);