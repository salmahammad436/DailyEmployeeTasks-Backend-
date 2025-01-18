import express from "express";
import cors from "cors";
import TaskRoute from "./Routes/Tasks.js";
import pool from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Built-in body parser
app.use(express.json());

// Routes
app.use("/task", TaskRoute);

// Database Connection using async/await
const connectToDatabase = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("Database connected successfully!");
    client.release(); 
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err.stack);
  }
};


connectToDatabase();
