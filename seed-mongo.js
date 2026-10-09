require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to Atlas');

  // Users (skipped if the email already exists)
  const people = [
    { name: 'Priya', email: 'priya@example.com' },
    { name: 'Rajan', email: 'rajan@example.com' },
    { name: 'Sita', email: 'sita@example.com' },
  ];
  const users = [];
  for (const p of people) {
    const u = await User.findOneAndUpdate(
      { email: p.email },
      { $setOnInsert: p },
      { upsert: true, new: true }
    );
    users.push(u);
  }
  const [priya, rajan, sita] = users;

  // Posts with different numbers of comments: 4, 3 and 1
  const plan = [
    { title: 'Indexing Strategies in Postgres', author: priya,
      comments: [
        ['This finally made indexes click for me', rajan],
        ['Great breakdown, saved this one', sita],
        ['Do you cover partial indexes?', rajan],
        ['Bookmarked for later', sita],
      ] },
    { title: 'Why I Moved Off MySQL', author: priya,
      comments: [
        ['Switched for the same reasons honestly', sita],
        ['What was the migration like?', rajan],
        ['Thanks for sharing', sita],
      ] },
    { title: 'Debugging N+1 Query Bugs', author: rajan,
      comments: [
        ['Hit this last week, great post', priya],
      ] },
  ];

  for (const item of plan) {
    const exists = await Post.findOne({ title: item.title });
    if (exists) {
      console.log('Skipped (already exists):', item.title);
      continue;
    }
    const post = await Post.create({ title: item.title, authorId: item.author._id });
    for (const [text, author] of item.comments) {
      await Comment.create({ text, postId: post._id, authorId: author._id });
    }
    console.log(`Inserted: "${item.title}" with ${item.comments.length} comments`);
  }

  console.log('\nusers:', await User.countDocuments());
  console.log('posts:', await Post.countDocuments());
  console.log('comments:', await Comment.countDocuments());

  await mongoose.disconnect();
}

main().catch(console.error);