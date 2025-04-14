const express = require('express');
const { SerialPort } = require('serialport');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');


const app = express();
const port = 3000; // Web server port
const serialocation = '/dev/ttyACM0'; // Serial port for the robot

// Serial port setup
const robotPort = new SerialPort({ path: serialocation, baudRate: 115200 });

robotPort.on('open', () => {
    console.log('Serial port opened');
    robotPort.write('testmode on\r\n')
    robotPort.write('playsound soundid 1\r\n')
});

robotPort.on('error', (err) => {
    console.error('Serial port error:', err.message);
});

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (e.g., HTML, CSS, JS)

// Endpoint to control the robot
app.post('/control', (req, res) => {
    const { leftSpeed, rightSpeed, speedMultiplier } = req.body;

    if (
        typeof leftSpeed !== 'number' ||
        typeof rightSpeed !== 'number' ||
        typeof speedMultiplier !== 'number'
    ) {
        return res.status(400).send('Invalid input');
    }

    // Log the received values for debugging
    console.log(`Received: leftSpeed=${leftSpeed}, rightSpeed=${rightSpeed}, speedMultiplier=${speedMultiplier}`);

    // Scale the speeds to the robot's range (e.g., -100 to 100)
    const scaledLeftSpeed = Math.round(100 * speedMultiplier);
    const scaledRightSpeed = Math.round(100 * speedMultiplier);

    // Construct the command to send to the robot
    const command = `setmotor lwheeldist ${leftSpeed * 10} speed ${Math.abs(scaledLeftSpeed)} rwheeldist ${rightSpeed * 10} speed ${Math.abs(scaledRightSpeed)}\r\n`;

    robotPort.write(command, (err) => {
        if (err) {
            console.error('Error writing to serial port:', err.message);
            return res.status(500).send('Failed to send command');
        }
        console.log(`Command sent: ${command}`);
        res.send('Command sent successfully');
    });
});



// Route to serve the webcam stream
app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
  });

  // Spawn ffmpeg to capture webcam frames with lower latency
  const ffmpeg = spawn('ffmpeg', [
    '-f', 'v4l2', // Use Video4Linux2 for webcam input
    '-fflags', 'nobuffer', // Minimize buffering
    '-i', '/dev/video0', // Path to the webcam device
    '-vf', 'scale=640:480', // Resize the video to 640x480
    '-r', '24', // Set frame rate to 24 fps (lower for less processing)
    '-q:v', '7', // Set quality level (higher value = lower quality)
    '-preset', 'ultrafast', // Use ultrafast preset for low latency
    '-f', 'image2pipe', // Output as a stream of images
    '-vcodec', 'mjpeg', // Use MJPEG codec
    'pipe:1', // Output to stdout
  ]);

  ffmpeg.stdout.on('data', (chunk) => {
    res.write(`--frame\r\n`);
    res.write(`Content-Type: image/jpeg\r\n\r\n`);
    res.write(chunk);
    res.write(`\r\n`);
  });

  ffmpeg.stderr.on('data', (data) => {
    console.error(`FFmpeg error: ${data}`);
  });

  ffmpeg.on('close', (code) => {
    console.log(`FFmpeg process exited with code ${code}`);
    res.end();
  });

  req.on('close', () => {
    ffmpeg.kill('SIGINT');
  });
});



// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});