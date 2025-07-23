const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://mat-game-2.vercel.app", // Replace with your frontend URL
    methods: ["GET", "POST"],
  },
});

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  socket.on("join_game", () => {
    console.log(`🟡 Player ${socket.id} wants to play`);

    if (!waitingPlayer) {
      // No waiting player — set current one as waiting
      waitingPlayer = socket;
      socket.emit("waiting", "Waiting for another player...");
    } else {
      // Found another player, start game
      const player1 = waitingPlayer;
      const player2 = socket;

      const roomID = `room-${player1.id}-${player2.id}`;
      player1.join(roomID);
      player2.join(roomID);

      console.log(
        `✅ Starting game between ${player1.id} and ${player2.id} in ${roomID}`
      );

      // Notify both players
      player1.emit("start_game", { opponentId: player2.id, roomID });
      player2.emit("start_game", { opponentId: player1.id, roomID });

      // Reset waitingPlayer
      waitingPlayer = null;
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

server.listen(10000, () => {
  console.log("🚀 Server listening on port 10000");
});
