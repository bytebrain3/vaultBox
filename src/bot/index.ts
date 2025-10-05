import { Telegraf, Context } from "telegraf";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import axios from "axios";

dotenv.config();

const telegramToken = process.env.telegramToken;
if (!telegramToken) throw new Error("Missing TELEGRAM_TOKEN!");

// Configure bot with timeout and retry options
const bot = new Telegraf<Context>(telegramToken);

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

bot.start((ctx) => {
  const name = ctx.from?.first_name + " " || "there";
  ctx.reply(`Welcome, ${name}! Upload your files here.`).catch(console.error);
});

bot.command("ping", async (ctx) => {
  console.log(`/ping called by ${ctx.from?.username}`);
  // call the backend also
  const response = await axios.get(`http://192.168.10.122:8080/ping`);

  if (response.data.status !== 200 && response.data.message !== "pong") {
    ctx.reply("Server is not running!").catch(console.error);
    return;
  }
  ctx.reply("Both server and bot are running!").catch(console.error);
});
const folderPath = (type: string) => {
  switch (type) {
    case "photo":
      return photoFolder;
    case "video":
      return videoFolder;
    default:
      return otherFolder;
  }
};
//create a function thats store the file base on the type
const downloadFile = async (file: any, type: string) => {
  try {
    if (file.file_size > 50 * 1024 * 1024) {
      return null;
    }
    const url = await bot.telegram.getFileLink(file.file_id);
    console.log(url);
    let filePath;

    const fileName = nanoid();
    if (!url) return;

    if (type === "photo") {
      filePath = path.join(
        folderPath(type),
        `${fileName}.${url.pathname.split(".").pop() || "jpg"}`
      );
    } else if (type === "video") {
      filePath = path.join(
        folderPath(type),
        `${fileName}.${file.file_name.split(".").pop() || "mp4"}`
      );
    } else {
      filePath = path.join(
        folderPath(type),
        `${fileName}.${file.file_name.split(".").pop() || "bin"}`
      );
    }

    const response = await axios.get(url.href, { responseType: "stream" });
    response.data.pipe(fs.createWriteStream(filePath));

    await new Promise((resolve, reject) => {
      response.data.on("end", resolve);
      response.data.on("error", reject);
    });

    return fileName;
  } catch (error) {
    console.error("Failed to download file:", error);
    return null;
  }
};

bot.on("message", async (ctx) => {
  const msg = ctx.message;
  if (!msg) return;
  console.log(msg);

  if (!msg.video && !msg.photo && !msg.document) return;

  if (
    msg.video?.file_size > 50 * 1024 * 1024 ||
    msg.photo?.[0].file_size > 50 * 1024 * 1024 ||
    msg.document?.file_size > 50 * 1024 * 1024
  ) {
    ctx.reply("File size is too large!").catch(console.error);
    return;
  }

  if (msg.video) {
    const res = await downloadFile(msg.video, "video");
    const downloadLink = `http://192.168.10.122:8080/d/${res}`;
    ctx.reply(`Upload success! ${downloadLink}`).catch(console.error);
  }
  if (msg.photo) {
    const res = await downloadFile(msg.photo[0], "photo");
    const downloadLink = `http://192.168.10.122:8080/d/${res}`;
    ctx.reply(`Upload success! ${downloadLink}`).catch(console.error);
  }
  if (msg.document) {
    const res = await downloadFile(msg.document, "other");
    const downloadLink = `http://192.168.10.122:8080/d/${res}`;
    ctx.reply(`Upload success! ${downloadLink}`).catch(console.error);
  }
});

bot.use((ctx, next) => {
  console.log("Incoming update:", JSON.stringify(ctx.update, null, 2));
  return next();
});

bot.catch((error, ctx) => {
  console.error(`Error occurred:`, error);
  if (ctx && ctx.reply) {
    ctx
      .reply("An error occurred. Please try again later.")
      .catch(console.error);
  }
});

async function launchBot(maxRetries: number = 5, delay: number = 5000) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      console.log(
        `Attempting to launch bot (attempt ${retries + 1}/${maxRetries})...`
      );
      await bot.launch();

      console.log("Bot launched successfully ✅");
      return;
    } catch (error: any) {
      retries++;
      console.error(`Launch attempt ${retries} failed:`, error.message);
      if (retries < maxRetries) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5;
      } else {
        console.error("Max retries reached. Bot failed to launch.");
        throw error;
      }
    }
  }
}

// Start the bot
launchBot().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  bot.stop("SIGTERM");
});
