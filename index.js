const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const cors = require('cors');
const { uniqueNamesGenerator, names } = require('unique-names-generator');

const app = express();

const server = app.listen(4000, () => {
    console.log("server started at port 4000");
});

const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

let elements = [];
let users = [];

app.post('/', (req, res) => {
    elements = (req.body);
    res.status(200).json({
        elements: elements
    })
})

app.get("/", (req, res) => {
    res.status(200).json({
        elements: elements
    })
});

let userCount = 1;
const userMap = new Map(); // Map to store socket-userId pairs

wss.on('connection', (socket) => {
    const userId = userCount;
    const room = socket.protocol || "default"; // Assuming the room is sent via the protocol field during connection
    const userData = { id: userId, color: getRandomHexColor(), name: uniqueNamesGenerator({ dictionaries: [names] }), room };

    userCount++;
    userMap.set(socket, userData); // Assign and store user data for this socket

    console.log(`User connected: ${userId} in room ${room}`);

    socket.on('message', (data, isBinary) => {
        const message = JSON.parse(data);

        // Only send the message to clients in the same room
        wss.clients.forEach((client) => {
            const clientData = userMap.get(client);
            if (client !== socket && client.readyState === WebSocket.OPEN && clientData.room === userData.room) {
                client.send(JSON.stringify({ ...message, user: userData.id, color: userData.color, userName: userData.name }), { binary: isBinary });
            }
        });
    });

    socket.on('close', () => {
        console.log(`User disconnected: ${userId}`);
        userMap.delete(socket); // Remove the user data when the user disconnects
    });
});

function getRandomHexColor() {
    // Generate random values for red, green, and blue components
    const red = Math.floor(Math.random() * 256); // Random integer between 0 and 255
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);

    // Convert decimal to hexadecimal
    const redHex = red.toString(16).padStart(2, '0'); // Convert to hex and pad with zero if needed
    const greenHex = green.toString(16).padStart(2, '0');
    const blueHex = blue.toString(16).padStart(2, '0');

    // Concatenate the hexadecimal values
    const hexColor = `#${redHex}${greenHex}${blueHex}`;

    return hexColor;
}
