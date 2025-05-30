import { UserModel, RequestMessageModel } from "../models/index.js";
import { CustomErrors } from "../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { validateToken } from "../utils/jwt.js";
import SOCKET_EVENTS from "../enums/socket-events.js";

const intializeSocketIo = (io) => {
  try {
    io.on("connection", async (socket) => {
      const authorization = socket?.handshake?.auth ?? {};

      if (!authorization.tokens) {
        socket.emit(SOCKET_EVENTS.SOCKET_ERROR_EVENT, "Authentication failed, Token is missing");
        socket.disconnect();
        return;
      }

      let authDecodedToken = validateToken(
        authorization.tokens.accessToken,
        process.env.ACCESS_TOKEN_SECRET
      );

      let dToken = authDecodedToken;

      const user = await UserModel.findById(dToken?._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
      );

      if (!user) {
        socket.emit(SOCKET_EVENTS.SOCKET_ERROR_EVENT, "Unauthorized handshake, Token is invalid");
        socket.disconnect();
        return;
      }

      socket.user = user;
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
          console.log(`User ${user?._id} joined user room`);
          socket.join(`user-${user?._id}`); // Regular users join the 'users' room
          socket.userId = user?._id;
        }
      });

      // socket.on(SOCKET_EVENTS.UPDATE_REQUEST_STATUS, async (date) => {
      //   if (!socket.adminId) return;
      // });

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
