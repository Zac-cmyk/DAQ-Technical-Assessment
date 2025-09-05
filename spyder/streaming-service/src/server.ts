////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// IMPORTS /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

import net from "net";
import { WebSocket, WebSocketServer } from "ws";
import { ValidateData, checkBatterySafety } from "./app";

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// INTERFACES //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

export interface VehicleData {
  battery_temperature: number | string;
  timestamp: number;
}

export interface SafetyAlertMessage {
  type: 'safety_alert';
  message: string;
  timestamp: number;
  temperature: number;
  count: number;
  duration: number;
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// SERVER //////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const TCP_PORT = 12000;
const WS_PORT = 8080;
const tcpServer = net.createServer();
const websocketServer = new WebSocketServer({ port: WS_PORT });

tcpServer.on("connection", (socket) => {
  console.log("TCP client connected");

  socket.on("data", (msg) => {
    const message: string = msg.toString();
    console.log(`Received: ${message}`);

    const vehicleData: VehicleData = JSON.parse(message);

    if (ValidateData(vehicleData)) {

      const alert: SafetyAlertMessage | null = checkBatterySafety(
        vehicleData.battery_temperature as number,
        vehicleData.timestamp
      );

      console.log("✅ Valid data: sending to frontend");

      // Send JSON over WS to frontend clients
      websocketServer.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(vehicleData));
        }
      });

      if (alert) {
        console.error(`[BATTERY SAFETY ALERT] ${new Date(alert.timestamp).toISOString()} - ${alert.message}`);
        websocketServer.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(alert));
          }
        });
      }
    } else {
       console.log("❌ Invalid data: sending stopped");
    }
    
    
  });

  socket.on("end", () => {
    console.log("Closing connection with the TCP client");
  });

  socket.on("error", (err) => {
    console.log("TCP client error: ", err);
  });
});

websocketServer.on("listening", () =>
  console.log(`Websocket server started on port ${WS_PORT}`)
);

websocketServer.on("connection", async (ws: WebSocket) => {
  console.log("Frontend websocket client connected");
  ws.on("error", console.error);
});

tcpServer.listen(TCP_PORT, () => {
  console.log(`TCP server listening on port ${TCP_PORT}`);
});
