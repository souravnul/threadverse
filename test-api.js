const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/communities/linux',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const body = JSON.parse(data);
      console.log('Body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.log('Body (text):', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
