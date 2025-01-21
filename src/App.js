import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function App() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    account: "",
    type: "",
    amount: "",
    date: "",
  });
  const [budget, setBudget] = useState(""); // State to store the budget
  const [totalExpenses, setTotalExpenses] = useState(0); // State for total expenses
  const [budgetExceeded, setBudgetExceeded] = useState(false); // State for budget status
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  }); // State for date range

  // Fetch transactions from the backend
  const fetchTransactions = () => {
    fetch("https://wallet-app-back-h4tl.onrender.com/transactions")
      .then((response) => response.json())
      .then((data) => {
        setTransactions(data.transactions);
        setFilteredTransactions(data.transactions);
        calculateTotalExpenses(data.transactions); // Calculate total expenses on fetch
      })
      .catch((error) => console.error("Error fetching transactions:", error));
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions by date range
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      const filtered = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      setFilteredTransactions(filtered);
      calculateTotalExpenses(filtered);
    } else {
      setFilteredTransactions(transactions);
      calculateTotalExpenses(transactions);
    }
  }, [dateRange, transactions]);

  // Calculate total expenses
  const calculateTotalExpenses = (transactions) => {
    const total = transactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    setTotalExpenses(total);
    checkBudget(total); // Check if budget is exceeded
  };

  // Check if expenses exceed the budget
  const checkBudget = (total) => {
    if (budget && total > budget) {
      setBudgetExceeded(true);
    } else {
      setBudgetExceeded(false);
    }
  };

  // Add a transaction
  const handleAddTransaction = () => {
    if (
      !newTransaction.account ||
      !newTransaction.type ||
      !newTransaction.amount ||
      !newTransaction.date
    ) {
      alert("Please fill in all fields.");
      return;
    }

    console.log("Sending Transaction:", newTransaction); // Debugging log

    fetch("https://wallet-app-back-h4tl.onrender.com/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTransaction),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Response from Backend:", data); // Debugging log
        if (data.transaction) {
          alert(data.message);
          const updatedTransactions = [...transactions, data.transaction];
          setTransactions(updatedTransactions);
          setNewTransaction({
            account: "",
            type: "",
            amount: "",
            date: "",
          });
        } else {
          alert("Failed to add transaction");
        }
      })
      .catch((error) => console.error("Error adding transaction:", error));
  };

  // Prepare data for the Pie Chart
  const accountsData = {
    labels: ["Bank Account", "Mobile Money Account", "Cash"],
    datasets: [
      {
        data: [
          filteredTransactions
            .filter((t) => t.account === "Bank Account")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0),
          filteredTransactions
            .filter((t) => t.account === "Mobile Money Account")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0),
          filteredTransactions
            .filter((t) => t.account === "Cash")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        ],
        backgroundColor: ["#42a5f5", "#66bb6a", "#ffa726"], // Colors for accounts
      },
    ],
  };

  const incomeExpenseData = {
    labels: ["Income", "Expense"],
    datasets: [
      {
        label: "Amount",
        data: [
          filteredTransactions
            .filter((t) => t.type === "Income")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0),
          filteredTransactions
            .filter((t) => t.type === "Expense")
            .reduce((sum, t) => sum + parseFloat(t.amount), 0),
        ],
        backgroundColor: ["#4caf50", "#f44336"], // Green for income, red for expense
      },
    ],
  };

  // Delete a transaction
  const handleDeleteTransaction = (id) => {
    fetch(`https://wallet-app-back-h4tl.onrender.com/transactions/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        setTransactions(
          transactions.filter((transaction) => transaction.id !== id)
        );
      })
      .catch((error) => console.error("Error:", error));
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Wallet App</h1>

      {/* Set Budget */}
      <div className="card p-4 mb-4">
        <h2 className="mb-3">Set Budget</h2>
        <div className="row g-3">
          <div className="col-md-8">
            <input
              type="number"
              className="form-control"
              placeholder="Enter your budget"
              value={budget}
              onChange={(e) => {
                setBudget(e.target.value);
                checkBudget(totalExpenses); // Recheck budget whenever it changes
              }}
            />
          </div>
          <div className="col-md-4">
            <button
              className="btn btn-success w-100"
              onClick={() => alert(`Budget set to $${budget}`)}
            >
              Set Budget
            </button>
          </div>
        </div>
        {budgetExceeded && (
          <div className="alert alert-danger mt-3">
            Warning: Your total expenses (${totalExpenses}) exceed your budget
            (${budget})!
          </div>
        )}
      </div>

      {/* Add Transaction */}
      <div className="card p-4 mb-4">
        <h2 className="mb-3">Add Transaction</h2>
        <div className="row g-3">
          <div className="col-md-3">
            <select
              className="form-control"
              value={newTransaction.account}
              onChange={(e) =>
                setNewTransaction({
                  ...newTransaction,
                  account: e.target.value,
                })
              }
            >
              <option value="" disabled>
                Select Account
              </option>
              <option value="Bank Account">Bank Account</option>
              <option value="Mobile Money Account">Mobile Money Account</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-control"
              value={newTransaction.type}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, type: e.target.value })
              }
            >
              <option value="" disabled>
                Select Type
              </option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Amount"
              value={newTransaction.amount}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, amount: e.target.value })
              }
            />
          </div>
          <div className="col-md-2">
            <input
              type="date"
              className="form-control"
              value={newTransaction.date}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, date: e.target.value })
              }
            />
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-primary w-100"
              onClick={handleAddTransaction}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Filter by Date Range
      <div className="card p-4 mb-4">
        <h2 className="mb-3">Filter by Date Range</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <input
              type="date"
              className="form-control"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
          </div>
          <div className="col-md-6">
            <input
              type="date"
              className="form-control"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        </div>
      </div> */}

      {/* Transactions Table */}
      <div className="card p-4 mb-4">
        <div className="row">
          <h2 className="mb-3 col-md-4">Transactions</h2>
          <div className="col-md-4">
            <input
              type="date"
              className="form-control"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
          </div>
          <div className="col-md-4">
            <input
              type="date"
              className="form-control"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        </div>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Account</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.date}</td>
                <td>{transaction.account}</td>
                <td>{transaction.type}</td>
                <td>${transaction.amount}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Income vs Expenses Chart */}
      <div className="card p-4 mb-4">
        {/* Charts */}
        <div className="row">
          <div className="col-md-6 mb-4">
            <h2 className="text-center">Income vs Expense</h2>
            <Bar data={incomeExpenseData} />
          </div>
          <div className="col-md-6 mb-4">
            <h2 className="text-center">Account Balances</h2>
            <Pie data={accountsData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
