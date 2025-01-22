import express from "express";
import cors from "cors";
import TaskRoute from "./Routes/Tasks.js";
import pool from "./db.js";
import winston from "winston";

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3001;

// Set up logging using winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: "app.log" }),
  ],
});

// CORS Middleware
app.use(cors());

// Built-in body parser
app.use(express.json());

// Global error handler middleware
app.use((error, req, res, next) => {
  if (error) {
    // Log error details
    logger.error(`${error.message}\nStack: ${error.stack}`);

    // Send error response
    res.status(500).json({
      message: error.message,
    });
  }
  next();
});

// Routes
app.use("/task", TaskRoute);

// Database Connection using async/await
const connectToDatabase = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    logger.info("Database connected successfully!");
    client.release();
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("Database connection failed:", err.stack);
  }
};

connectToDatabase();
