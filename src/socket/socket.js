import { UserModel, RequestMessageModel } from "../models/index.js";
import { validateToken } from "../utils/jwt.js";
import SOCKET_EVENTS from "../enums/socket-events.js";

const intializeSocketIo = (io) => {
  try {
    io.on("connection", async (socket) => {
      const authorization = socket?.handshake?.auth ?? {};

      // Check for token in multiple possible locations
      const token =
        authorization.token || authorization.accessToken || authorization.tokens?.accessToken;

      if (!token) {
        socket.emit(SOCKET_EVENTS.SOCKET_ERROR_EVENT, "Authentication failed, Token is missing");
        socket.disconnect(true);
        return;
      }

      let decodedToken;
      try {
        decodedToken = validateToken(token, process.env.ACCESS_TOKEN_SECRET);
      } catch (tokenError) {
        console.error("❌ Token validation failed:", tokenError.message);
        socket.emit(SOCKET_EVENTS.SOCKET_ERROR_EVENT, "Authentication failed: Invalid token");
        socket.disconnect(true);
        return;
      }

      if (!decodedToken || !decodedToken._id) {
        console.error("❌ Invalid token payload");
        socket.emit(
          SOCKET_EVENTS.SOCKET_ERROR_EVENT,
          "Authentication failed: Invalid token payload"
        );
        socket.disconnect(true);
        return;
      }

      const user = await UserModel.findById(decodedToken?._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
      );

      if (!user) {
        socket.emit(SOCKET_EVENTS.SOCKET_ERROR_EVENT, "Unauthorized handshake, Token is invalid");
        socket.disconnect();
        return;
      }

      socket.user = user;
      socket.userId = user._id.toString();
      socket.join(user?._id?.toString());
      socket.emit(SOCKET_EVENTS.CONNECTED_EVENT);

      // Send current pending count
      const pendingCount = await RequestMessageModel.countDocuments({ status: "PENDING" });

      socket.on(SOCKET_EVENTS.JOIN_ADMIN_ROOM, () => {
        console.log(user.role);

        // **Assign User to Role-Based Rooms**
        if (["ADMIN", "MODERATOR"].includes(user.role)) {
          console.log(`Admin ${user?._id} joined admin room`);

          socket.join("admin-room"); // Admins join the 'admin' room
          socket.adminId = user?._id;

          socket.emit(SOCKET_EVENTS.ADMIN_NOTIFICATION_COUNT, pendingCount);
        }
      });

      socket.on(SOCKET_EVENTS.JOIN_USER_ROOM, () => {
        if (user.role === "USER") {
          const userRoom = `user-${user._id}`;
          console.log(`👤 User ${user.username} joined user room: ${userRoom}`);
          socket.join(userRoom);
          socket.userRoomId = userRoom;
        }
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log(`❌ User ${user.username} disconnected: ${reason}`);

        try {
          // Leave all rooms
          socket.leave(socket.userId);

          if (socket.adminId) {
            socket.leave("admin-room");
          }

          if (socket.userRoomId) {
            socket.leave(socket.userRoomId);
          }
        } catch (error) {
          console.error("❌ Error during disconnect cleanup:", error);
        }
      });

      socket.on(SOCKET_EVENTS.DISCONNECTED_EVENT, () => {
        if (socket?.user?._id) {
          socket.leave(socket?.user?._id.toString());
        }

        socket.leave(
          ["ADMIN", "MODERATOR"].includes(user.role) ? "admin-room" : `users-${user?._id}`
        );

        socket.emit(SOCKET_EVENTS.DISCONNECTED_EVENT);
      });
    });
  } catch (error) {
    socket.emit(
      SOCKET_EVENTS.SOCKET_ERROR_EVENT,
      error?.message || "Something went wrong while connecting to the sockets"
    );
  }
};

const emitSocketEventToUser = (req, event, room, payload) => {
  const io = req.app.get("io");

  return io.to(room).emit(event, payload);
};

const emitSocketEventToAdmin = (req, event, room, payload) => {
  const io = req.app.get("io");

  return io.to(room).emit(event, payload);
};

export { intializeSocketIo, emitSocketEventToUser, emitSocketEventToAdmin };
