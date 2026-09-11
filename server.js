const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    name: "KLYRO AI",
    status: "online",
    message: "KLYRO AI server is running 🚀"
  }));
});

server.listen(PORT, () => {
  console.log(`KLYRO AI running on port ${PORT}`);
});
