const express = require("express");
const cors = require("cors");
const axios = require("axios");
const Redis = require("redis");

const app = express();
const port = 5000;

const DEFAULT_EXPIRATION = 3600;
let redisPort = 6379; // Replace with your redis port
let redisHost = "127.0.0.1"; // Replace with your redis host

const redisClient = Redis.createClient({
  socket: {
    port: redisPort,
    host: redisHost,
  },
});

(async () => {
  // Connect to redis server
  await redisClient.connect();
})();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/photos", async (req, res) => {
  const albumId = req.query.albumId;

  const redisPhotos = await redisClient.get(`photos?albumId=${albumId}`);

  if (redisPhotos != null) {
    console.log("Cache Hit");
    res.json(JSON.parse(redisPhotos));
  } else {
    console.log("Cache Miss");
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      { params: { albumId } }
    );

    redisClient.setEx(
      `photos?albumId=${albumId}`,
      DEFAULT_EXPIRATION,
      JSON.stringify(data)
    );
    res.json(data);
  }
});

app.get("/photos/:id", async (req, res) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
  );

  res.json(data);
});

// function getOrSetCache(key, cb) {
//   return new Promise((resolve, reject) => {
//     redisClient.get(key, (error, data) => {
//       if (error) return reject(error);
//       if (data != null) return resolve(JSON.parse(data));
//     });
//   });
// }

app.listen(port, () => console.log(`server running on port ${port}`));
