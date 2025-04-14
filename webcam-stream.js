const express = require('express');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

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

// Serve a simple HTML page for the client
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Webcam Stream</title>
    </head>
    <body>
      <h1>Webcam Stream</h1>
      <img src="/stream" alt="Webcam Stream" />
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});