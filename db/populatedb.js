#! /usr/bin/env node
require("dotenv").config();
const { Client } = require("pg");
const SQL = `
-- ENUMS
CREATE TYPE "NotificationSourceType" AS ENUM ('POST', 'COMMENT', 'REALM', 'USER');

-- USER TABLE
CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  bio TEXT,
  profilePictureUrl TEXT,
  profilePicturePublicId TEXT
);

-- REALM TABLE
CREATE TABLE IF NOT EXISTS "Realm" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  realmPictureUrl TEXT,
  realmPicturePublicId TEXT,
  creatorId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE
);

-- POST TABLE
CREATE TABLE IF NOT EXISTS "Post" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now(),
  published BOOLEAN NOT NULL,
  realmId UUID REFERENCES "Realm"(id) ON DELETE CASCADE,
  title TEXT,
  text TEXT,
  authorId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE
);

-- IMAGE TABLE
CREATE TABLE IF NOT EXISTS "Image" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  publicId TEXT,
  ownerId UUID REFERENCES "User"(id) ON DELETE CASCADE,
  postId UUID REFERENCES "Post"(id) ON DELETE CASCADE
);

-- LIKE TABLE
CREATE TABLE IF NOT EXISTS "Like" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  postId UUID NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  UNIQUE(userId, postId)
);
CREATE INDEX IF NOT EXISTS idx_like_userId ON "Like"(userId);
CREATE INDEX IF NOT EXISTS idx_like_postId ON "Like"(postId);

-- COMMENT TABLE
CREATE TABLE IF NOT EXISTS "Comment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  updatedAt TIMESTAMPTZ DEFAULT now(),
  comment TEXT NOT NULL,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  postId UUID NOT NULL REFERENCES "Post"(id) ON DELETE CASCADE,
  parentId UUID REFERENCES "Comment"(id) ON DELETE CASCADE
);

-- COMMENT LIKE TABLE
CREATE TABLE IF NOT EXISTS "CommentLike" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  createdAt TIMESTAMPTZ DEFAULT now(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  commentId UUID NOT NULL REFERENCES "Comment"(id) ON DELETE CASCADE,
  UNIQUE(userId, commentId)
);
CREATE INDEX IF NOT EXISTS idx_commentlike_userId ON "CommentLike"(userId);
CREATE INDEX IF NOT EXISTS idx_commentlike_commentId ON "CommentLike"(commentId);

-- FOLLOW TABLE
CREATE TABLE IF NOT EXISTS "Follow" (
  followerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  followingId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (followerId, followingId)
);

-- JOIN REALM TABLE
CREATE TABLE IF NOT EXISTS "JoinRealm" (
  joinerId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  realmId UUID NOT NULL REFERENCES "Realm"(id) ON DELETE CASCADE,
  createdAt TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (joinerId, realmId)
);

-- NOTIFICATION TABLE
CREATE TABLE IF NOT EXISTS "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  actorId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  sourceType "NotificationSourceType" NOT NULL,
  postId UUID REFERENCES "Post"(id) ON DELETE CASCADE,
  commentId UUID REFERENCES "Comment"(id) ON DELETE CASCADE,
  realmId UUID REFERENCES "Realm"(id) ON DELETE CASCADE,
  createdAt TIMESTAMPTZ DEFAULT now(),
  isRead BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_notification_userId ON "Notification"(userId);

-- MESSAGE TABLE
CREATE TABLE IF NOT EXISTS "Message" (
  id SERIAL PRIMARY KEY,
  senderId UUID NOT NULL REFERENCES "User"(id),
  receiverId UUID NOT NULL REFERENCES "User"(id),
  imageUrl TEXT,
  content TEXT,
  createdAt TIMESTAMPTZ DEFAULT now()
);
`;

async function main() {
  console.log("seeding...");
  const client = new Client({
    connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  });
  await client.connect();
  await client.query(SQL);
  await client.end();
  console.log("done");
}

main();
