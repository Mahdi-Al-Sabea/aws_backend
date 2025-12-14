const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const Item = require("./models/Item");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan("dev"));
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173",
  "https://global.mahdisab.site",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from tools like Postman (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("❌ CORS blocked: Not allowed by server"));
      }
    },
    credentials: true,
  })
);

const getMongoURI = async () => {
  const secret_name = "fullStack-test-mongo-url";

  const client = new SecretsManagerClient({
    region: "me-south-1",
  });

  let response;

  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
      })
    );

    const secret = response.SecretString;

    try {
      const parsed = JSON.parse(secret);
      return parsed.MONGO_URI;
    } catch {
      return secret; // plain string
    }
  } catch (error) {
    // For a list of exceptions thrown, see
    // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    throw error;
  }
};

// Routes

// GET all items
app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ date: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new item
app.post("/api/items", async (req, res) => {
  try {
    const newItem = new Item({
      name: req.body.name,
      description: req.body.description,
    });
    const item = await newItem.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE item
app.delete("/api/items/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false });
    await item.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const startServer = async () => {
  let db;

  console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Fetching Mongo URI...");

  if (process.env.NODE_ENV !== "production") {
    db = process.env.MONGO_URI;
  } else {
    db = await getMongoURI();
  }

  console.log("db string length:", db.length);

  await mongoose.connect(db);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
