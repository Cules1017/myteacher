const http = require('http');
http.get('http://localhost:5173/cong-viec', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data.length > 0 ? "Got response" : "Empty"));
}).on("error", (err) => console.log("Error: " + err.message));
