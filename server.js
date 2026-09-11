const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

const server = http.createServer(async (req, res) => {

  // HOME PAGE
  if (req.method === "GET" && req.url === "/") {
    const filePath = path.join(__dirname, "index.html");

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error("INDEX ERROR:", err);
        res.writeHead(500, {
          "Content-Type": "text/plain"
        });
        res.end("KLYRO AI - Unable to load website");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/html"
      });

      res.end(data);
    });

    return;
  }

  // GENERATE VIDEO
  if (req.method === "POST" && req.url === "/generate") {

    console.log("GENERATE REQUEST RECEIVED");

    if (!REPLICATE_API_TOKEN) {
      console.error("ERROR: REPLICATE_API_TOKEN is missing");

      res.writeHead(500, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        error: "REPLICATE_API_TOKEN is missing"
      }));

      return;
    }

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {

      try {

        const data = JSON.parse(body);
        const prompt = data.prompt;

        console.log("PROMPT:", prompt);

        if (!prompt) {
          res.writeHead(400, {
            "Content-Type": "application/json"
          });

          res.end(JSON.stringify({
            error: "Prompt is required"
          }));

          return;
        }

        console.log("Sending request to Replicate...");

        const response = await fetch(
          "https://api.replicate.com/v1/models/wan-video/wan-2.1-1.3b/predictions",
          {
            method: "POST",

            headers: {
              "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
              "Content-Type": "application/json"
            },

            body: JSON.stringify({
              input: {
                prompt: prompt,
                resolution: "480p",
                aspect_ratio: "16:9"
              }
            })
          }
        );

        const result = await response.json();

        console.log("REPLICATE STATUS:", response.status);
        console.log("REPLICATE RESPONSE:", JSON.stringify(result));

        if (!response.ok) {

          res.writeHead(response.status, {
            "Content-Type": "application/json"
          });

          res.end(JSON.stringify({
            error:
              result.detail ||
              result.error ||
              "Replicate request failed",
            replicate: result
          }));

          return;
        }

        res.writeHead(200, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          id: result.id,
          status: result.status
        }));

      } catch (error) {

        console.error("GENERATE ERROR:", error);

        res.writeHead(500, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          error: error.message
        }));
      }
    });

    return;
  }

  // CHECK VIDEO STATUS
  if (req.method === "GET" && req.url.startsWith("/status")) {

    try {

      const url = new URL(
        req.url,
        `http://${req.headers.host}`
      );

      const id = url.searchParams.get("id");

      if (!id) {

        res.writeHead(400, {
          "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
          error: "Prediction ID is required"
        }));

        return;
      }

      console.log("CHECKING PREDICTION:", id);

      const response = await fetch(
        `https://api.replicate.com/v1/predictions/${id}`,
        {
          headers: {
            "Authorization": `Bearer ${REPLICATE_API_TOKEN}`
          }
        }
      );

      const result = await response.json();

      console.log(
        "PREDICTION STATUS:",
        result.status
      );

      if (result.error) {
        console.error(
          "PREDICTION ERROR:",
          result.error
        );
      }

      res.writeHead(response.status, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        status: result.status,
        output: result.output || null,
        error: result.error || null
      }));

    } catch (error) {

      console.error("STATUS ERROR:", error);

      res.writeHead(500, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        error: error.message
      }));
    }

    return;
  }

  // 404
  res.writeHead(404, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    error: "Not found"
  }));
});

server.listen(PORT, () => {
  console.log(`KLYRO AI running on port ${PORT}`);
});
