import { UserModel } from "../models/index.js";
import { CustomErrors } from "../middleware/custom/custom.errors.js";
import { StatusCodes } from "http-status-codes";
import { validateToken } from "../utils/jwt.js";
import SOCKET_EVENTS from "../enums/socket-events.js";

const intializeSocketIo = (io) => {
  try {
    io.on("connection", async (socket) => {
      const authorization = socket?.handshake?.auth ?? {};
      
      if (!authorization.tokens) {
        throw new CustomErrors(
          "Un-authentication failed, Token is invalid",
          StatusCodes.UNAUTHORIZED,
          []
        );
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
        throw new CustomErrors(
          "Un-authorized handshake, Token is invalid",
          StatusCodes.UNAUTHORIZED,
          []
        );
      }

      socket.user = user;
      socket.join(user?._id?.toString());
      socket.emit(SOCKET_EVENTS.CONNECTED_EVENT);

      // **Assign User to Role-Based Rooms**
      if (["ADMIN", "MODERATOR"].includes(user.role)) {
        socket.join("admin"); // Admins join the 'admin' room
      } else {
        socket.join("users"); // Regular users join the 'users' room
      }

      console.log(`connected :  ${socket.user?._id}`);

      socket.on(SOCKET_EVENTS.DISCONNECTED_EVENT, () => {
        if (socket?.user?._id) {
          socket.leave(socket?.user?._id);
        }

        socket.leave(["ADMIN", "MODERATOR"].includes(user.role) ? "admin" : "users");
      });
    });
  } catch (error) {
    socket.emit(
      SOCKET_EVENTS.SOCKET_ERROR_EVENT,
      error?.message || "Something went wrong while connecting to the sockets"
    );
  }
};

const emitSocketEventToUser = (req, event, payload) => {
  const io = req.app.get("io");

  return io.to("users").emit(event, payload);
};

const emitSocketEventToAdmin = (req, event, payload) => {
  const io = req.app.get("io");

  return io.to("admin").emit(event, payload);
};

export { intializeSocketIo, emitSocketEventToUser, emitSocketEventToAdmin };
