import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { config } from "dotenv";

// IMPORT CRON JOB
import "../jobs/cleanup";

config();
const app = express();

app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.get("/", (req, res) => {
  res.send("Hello from the API! 👋");
});

app.get("/ping", (req, res) => {
  res.json({
    status: 200,
    message: "pong",
  });
});

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "./uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const photoFolder =
  process.env.photoFolder || path.join(__dirname, "./uploads/photo");
if (!fs.existsSync(photoFolder)) {
  fs.mkdirSync(photoFolder, { recursive: true });
}

const videoFolder =
  process.env.videoFolder || path.join(__dirname, "./uploads/video");
if (!fs.existsSync(videoFolder)) {
  fs.mkdirSync(videoFolder, { recursive: true });
}

const otherFolder =
  process.env.otherFolder || path.join(__dirname, "./uploads/other");
if (!fs.existsSync(otherFolder)) {
  fs.mkdirSync(otherFolder, { recursive: true });
}
function findFileById(baseDir: string, id: string): string | null {
  const folders = fs.readdirSync(baseDir);

  for (const folder of folders) {
    const folderPath = path.join(baseDir, folder);
    const stats = fs.statSync(folderPath);

    if (stats.isDirectory()) {
      const files = fs.readdirSync(folderPath);
      const found = files.find((f) => f.startsWith(id));
      if (found) {
        return path.join(folderPath, found); // full file path
      }
    }
  }
  return null;
}

app.get("/d/:id", (req, res) => {
  try {
    const { id } = req.params;

    // Search for file across all upload folders
    const filePath = findFileById(uploadDir, id);

    if (!filePath) {
      return res.status(404).json({
        status: 404,
        message: "File not found",
      });
    }

    // Serve file
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        console.error("Download error:", err);
        res
          .status(500)
          .json({ status: 500, message: "Error downloading file" });
      }
    });
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({
      status: 500,
      message: "Internal server error",
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("http://localhost:%s", process.env.PORT || 3000);
});
