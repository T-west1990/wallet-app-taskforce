const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// // Database connection pool
// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS || "", // Default to empty string if no password is provided
//   database: process.env.DB_NAME,
//   connectionLimit: 10, // Maximum number of connections in the pool
// });

//Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "wallet_app",
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Wallet App Backend");
});

// Get all transactions
app.get("/transactions", (req, res) => {
  const query = "SELECT * FROM transactions";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ error: "Database query failed" });
    }
    res.json({ transactions: results });
  });
});

// Add a new transaction
app.post("/transactions", (req, res) => {
  const { account, type, amount, date } = req.body;

  // Validate input
  if (!account || !type || !amount || !date) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const query =
    "INSERT INTO transactions (account, type, amount, date) VALUES (?, ?, ?, ?)";
  db.query(query, [account, type, amount, date], (err, result) => {
    if (err) {
      console.error("Error inserting transaction:", err);
      return res.status(500).json({ message: "Failed to add transaction" });
    }
    res.status(201).json({
      message: "Transaction added successfully!",
      transaction: { id: result.insertId, account, type, amount, date },
    });
  });
});

// Delete a transaction by ID
app.delete("/transactions/:id", (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM transactions WHERE id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error("Error deleting transaction:", err);
      return res.status(500).json({ message: "Failed to delete transaction" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json({ message: "Transaction deleted successfully!" });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

