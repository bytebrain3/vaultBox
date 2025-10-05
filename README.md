

# Telegram File Upload Bot for Raspberry Pi

I built this lightweight Telegram bot specifically to run on my **Raspberry Pi**. It allows users to upload files (photos, videos, documents), stores them in local folders, and automatically cleans up uploaded files daily at midnight. No database is required — everything is stored on the filesystem.

---

## Features

* Upload photos, videos, and other files via Telegram.
* Files are saved into dedicated folders:

  * `uploads/photo`
  * `uploads/video`
  * `uploads/other`
* Daily automatic cleanup of all uploaded files at midnight.
* Lightweight and easy to set up.
* Configurable upload directories via environment variables.

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/bytebrain3/vaultBox.git
cd vaultBox
```

2. Install dependencies:

```bash
bun install
```

3. Create a `.env` file in the root directory:

```env
telegramToken=YOUR_TELEGRAM_BOT_TOKEN
UPLOAD_DIR=./uploads
photoFolder=./uploads/photo
videoFolder= ./uploads/video
otherFolder=./uploads/other
```

> You can leave `UPLOAD_DIR` and folder paths as defaults.

---

## Usage

Start the bot in development mode:

```bash
bun run dev
# or
ts-node src/bot/index.ts
```

The bot will:

1. Respond to `/start` with a welcome message.
2. Handle uploaded photos, videos, and documents.
3. Save the files in their respective folders.
4. Automatically clean all uploaded files every midnight.

---

## Folder Structure

```
project/
│
├─ src/
│  ├─ bot/
│  │  └─ index.ts       # Bot logic
|  ├─ api /
|  │  └─ server.ts      # express server logic
|  ├─ jobs /
|  │  └─ cleanup.ts     # clean the file in  every day at midnight
├─ uploads/
│  ├─ photo/            # Uploaded photos
│  ├─ video/            # Uploaded videos
│  └─ other/            # Other files
│
├─ package.json
└─ README.md
```

---

## Notes

* Files larger than 50 MB are automatically rejected.
* No database is used — everything is stored in the filesystem.
* Ensure the bot has write permissions for the `uploads` folder.

