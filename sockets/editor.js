const cookie = require("cookie");
const { validateToken } = require("../services/authentication");
const Blog = require("../models/blog");
const BlogVersion = require("../models/blogVersion");

const SAVE_DELAY_MS = 2000;            // debounce: save 2s after typing stops
const SNAPSHOT_EVERY_MS = 60 * 1000;   // at most one version per minute per blog

const presence = new Map();       // blogId -> Map(socketId -> user)
const saveTimers = new Map();     // blogId -> debounce timer
const lastSnapshot = new Map();   // blogId -> time of last version

function onlineUsers(blogId) {
  const room = presence.get(blogId);
  if (!room) return [];
  const unique = new Map();                       // same user in 2 tabs counts once
  for (const u of room.values()) unique.set(u._id, u);
  return [...unique.values()];
}

function scheduleSave(io, blogId, body, userId) {
  clearTimeout(saveTimers.get(blogId));
  saveTimers.set(blogId, setTimeout(async () => {
    try {
      await Blog.findByIdAndUpdate(blogId, { body });
      const now = Date.now();
      if (now - (lastSnapshot.get(blogId) || 0) > SNAPSHOT_EVERY_MS) {
        const newVer = await BlogVersion.create({ blogId, body, savedBy: userId });
        await newVer.populate("savedBy");
        lastSnapshot.set(blogId, now);

        if (io) {
          io.to(blogId).emit("versionCreated", {
            _id: newVer._id,
            blogId: newVer.blogId,
            body: newVer.body,
            createdAt: newVer.createdAt,
            savedBy: newVer.savedBy ? {
              _id: newVer.savedBy._id,
              firstName: newVer.savedBy.firstName,
              email: newVer.savedBy.email,
            } : null,
          });
        }
      }
    } catch (err) {
      console.error("Autosave failed:", err.message);
    }
  }, SAVE_DELAY_MS));
}

const COLORS = [
  "#e63946", // vibrant crimson red
  "#0d6efd", // classic blue
  "#198754", // emerald green
  "#6f42c1", // royal purple
  "#fd7e14", // vivid orange
  "#0dcaf0", // bright cyan
  "#d63384", // deep pink
  "#20c997", // teal
];

function getColorForId(id) {
  let hash = 0;
  const s = String(id || "");
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

function leaveRoom(io, socket) {
  const blogId = socket.blogId;
  if (!blogId) return;
  socket.leave(blogId);
  const room = presence.get(blogId);
  if (room) {
    room.delete(socket.id);
    if (room.size === 0) presence.delete(blogId);
  }
  const uid = socket.user ? socket.user._id : null;
  socket.blogId = null;
  io.to(blogId).emit("presence", onlineUsers(blogId));
  if (uid) {
    io.to(blogId).emit("userLeft", { userId: uid });
  }
}

module.exports = (io) => {
  // 1. Authenticate every socket with the same JWT cookie
  io.use((socket, next) => {
    try {
      const { token } = cookie.parseCookie(socket.handshake.headers.cookie || "");
      socket.user = validateToken(token);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    // 2. Join a blog's room (only owner or collaborator)
    socket.on("join", async (blogId) => {
      try {
        const blog = await Blog.findById(blogId);
        const uid = socket.user._id;
        const allowed =
          blog &&
          (String(blog.createdBy) === uid ||
            blog.collaborators.some((c) => String(c) === uid));
        if (!allowed) return socket.emit("forbidden");

        leaveRoom(io, socket); // in case of a re-join
        socket.join(blogId);
        socket.blogId = blogId;
        if (!presence.has(blogId)) presence.set(blogId, new Map());

        const userName = socket.user.firstName || socket.user.email.split("@")[0];
        const userColor = getColorForId(uid);

        presence.get(blogId).set(socket.id, {
          _id: uid,
          email: socket.user.email,
          name: userName,
          color: userColor,
        });

        socket.emit("init", { body: blog.body, myColor: userColor, myId: uid });
        io.to(blogId).emit("presence", onlineUsers(blogId));
      } catch (err) {
        socket.emit("forbidden");
      }
    });

    // 3. Relay edits and schedule the debounced save
    socket.on("edit", ({ body, cursor }) => {
      if (!socket.blogId || typeof body !== "string") return;
      const userName = socket.user.firstName || socket.user.email.split("@")[0];
      const userColor = getColorForId(socket.user._id);

      socket.to(socket.blogId).emit("edit", {
        body,
        userId: socket.user._id,
        name: userName,
        color: userColor,
        cursor,
      });
      scheduleSave(io, socket.blogId, body, socket.user._id);
    });

    // 4. Cursor position tracking
    socket.on("cursor", ({ position }) => {
      if (!socket.blogId) return;
      const userName = socket.user.firstName || socket.user.email.split("@")[0];
      const userColor = getColorForId(socket.user._id);
      socket.to(socket.blogId).emit("cursor", {
        userId: socket.user._id,
        name: userName,
        color: userColor,
        position: typeof position === "number" ? position : 0,
      });
    });

    // 5. Typing indicator
    socket.on("typing", ({ isTyping }) => {
      if (!socket.blogId) return;
      const userName = socket.user.firstName || socket.user.email.split("@")[0];
      const userColor = getColorForId(socket.user._id);
      socket.to(socket.blogId).emit("typing", {
        userId: socket.user._id,
        name: userName,
        color: userColor,
        isTyping: Boolean(isTyping),
      });
    });

    // 6. Leaving: button click or automatic disconnect
    socket.on("leave", () => leaveRoom(io, socket));
    socket.on("disconnect", () => leaveRoom(io, socket));
  });
};
