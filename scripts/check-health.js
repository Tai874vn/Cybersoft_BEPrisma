#!/usr/bin/env node

/**
 * Health check script
 * Tests if the server is running and responsive
 */

const http = require('http');

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || 'localhost';

const options = {
  hostname: HOST,
  port: PORT,
  path: '/health',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        console.log('✅ Server is healthy');
        console.log('Status:', response.status);
        console.log('Timestamp:', response.timestamp);
        process.exit(0);
      } catch (error) {
        console.error('❌ Invalid response format');
        console.error(data);
        process.exit(1);
      }
    } else {
      console.error(`❌ Server returned status code: ${res.statusCode}`);
      console.error(data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Health check failed');
  console.error('Error:', error.message);
  console.error(`\nMake sure the server is running on http://${HOST}:${PORT}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Health check timed out');
  console.error(`Server did not respond within 5 seconds`);
  req.destroy();
  process.exit(1);
});

req.end();
