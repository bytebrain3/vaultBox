import nodeCron from "node-cron";
import fs from "fs";
import path from "path";

// Folder paths
const photoFolder = path.join(__dirname, "uploads/photo");
const videoFolder = path.join(__dirname, "uploads/video");
const otherFolder = path.join(__dirname, "uploads/other");

const folders = [photoFolder, videoFolder, otherFolder];

// Cron: every day at midnight
nodeCron.schedule("0 0 * * *", () => {
  console.log("Running daily cleanup...");

  folders.forEach((folder) => {
    fs.readdir(folder, (err, files) => {
      if (err) {
        console.error(`Failed to read folder ${folder}:`, err);
        return;
      }

      files.forEach((file) => {
        const filePath = path.join(folder, file);
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Failed to delete ${filePath}:`, err);
          else console.log(`Deleted file: ${filePath}`);
        });
      });
    });
  });

  console.log("Daily cleanup completed ✅");
});
