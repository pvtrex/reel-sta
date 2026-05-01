const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load .env file
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  if (line && !line.startsWith("#")) {
    const [key, ...valueParts] = line.split("=");
    envVars[key] = valueParts.join("=");
  }
});

const MONGODB_URI = envVars.MONGODB_URI;

async function dropIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get the collection
    const usersCollection = mongoose.connection.collection("users");

    // List all indexes
    const indexes = await usersCollection.getIndexes();
    console.log("Current indexes:", indexes);

    // Drop the username_1 index if it exists
    if (indexes.username_1) {
      await usersCollection.dropIndex("username_1");
      console.log("✓ Dropped username_1 index");
    } else {
      console.log("username_1 index not found");
    }

    // List indexes after
    const newIndexes = await usersCollection.getIndexes();
    console.log("Indexes after drop:", newIndexes);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

dropIndex();
