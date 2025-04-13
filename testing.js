const { SerialPort } = require('serialport');

const serialocation = '/dev/ttyACM0';

const port = new SerialPort({ path: serialocation, baudRate: 115200 });


const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.on('line', (input) => {
    // Process the input received from the terminal
    console.log(`You entered: ${input}`);
    port.write(input + '\r\n', (err) => {
        if (err) {
            console.error('Error writing to port:', err.message);
        } else {
            console.log('Command sent successfully');
        }
    }
    );
    // Optionally close the readline interface if no further input is needed
    // readline.close();
});

// Optionally, you can write a message to the console before listening for input
console.log('Ready for input:');


port.on('data', (data) => {
    console.log('Data received:', data.toString());
});

// port.on('open', () => {
//     console.log('Port opened');

//     // Write command to the port

//     port.write('testmode on\r\n')
    
//     port.write('playsound soundid 1\r\n', (err) => {
//         if (err) {
//             console.error('Error writing to port:', err.message);
//         } else {
//             console.log('Command sent successfully');
//         }
//     });
// });

port.on('error', (err) => {
    console.error('Serial port error:', err.message);
});