const express = require('express');
const { SerialPort } = require('serialport');
const bodyParser = require('body-parser');

const app = express();
const port = 3000; // Web server port
const serialocation = '/dev/ttyACM0'; // Serial port for the robot

// Serial port setup
const robotPort = new SerialPort({ path: serialocation, baudRate: 115200 });

robotPort.on('open', () => {
    console.log('Serial port opened');
    robotPort.write('testmode on\r\n')
});

robotPort.on('error', (err) => {
    console.error('Serial port error:', err.message);
});

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (e.g., HTML, CSS, JS)

// Endpoint to control the robot
app.post('/control', (req, res) => {
    const { leftSpeed, rightSpeed } = req.body;

    if (typeof leftSpeed !== 'number' || typeof rightSpeed !== 'number') {
        return res.status(400).send('Invalid speeds');
    }

    // Calculate and send command to the robot
    // const command = `setspeed ${leftSpeed} ${rightSpeed}\r\n`;
    const command = `setmotor lwheeldist ${leftSpeed} speed ${Math.abs(leftSpeed)} rwheeldist ${rightSpeed} speed ${Math.abs(rightSpeed)}\r\n`;
    robotPort.write(command, (err) => {
        if (err) {
            console.error('Error writing to serial port:', err.message);
            return res.status(500).send('Failed to send command');
        }
        console.log(`Command sent: ${command}`);
        res.send('Command sent successfully');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});