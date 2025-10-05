// cleanup.ts
import nodeCron from "node-cron";
import fs from "fs";
import path from "path";

// Folders
const photoFolder = path.join(__dirname, "../uploads/photo");
const videoFolder = path.join(__dirname, "../uploads/video");
const otherFolder = path.join(__dirname, "../uploads/other");
const folders = [photoFolder, videoFolder, otherFolder];

// Cron
nodeCron.schedule("0 0 * * *", () => {
  console.log("Running daily cleanup...");
  folders.forEach((folder) => {
    fs.readdir(folder, (err, files) => {
      if (err) return console.error(`Failed to read ${folder}:`, err);
      files.forEach((file) => {
        fs.unlink(path.join(folder, file), (err) => {
          if (err) console.error(`Failed to delete ${file}:`, err);
          else console.log(`Deleted file: ${file}`);
        });
      });
    });
  });
  console.log("Daily cleanup completed ✅");
});
