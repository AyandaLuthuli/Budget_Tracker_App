document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const transactionForm = document.getElementById("transaction-form");
  const descriptionInput = document.getElementById("description");
  const amountInput = document.getElementById("amount");
  const categoryInput = document.getElementById("category");
  const typeInput = document.getElementById("type");
  const transactionList = document.getElementById("transaction-list");
  const balanceElement = document.getElementById("balance");
  const incomeTotalElement = document.getElementById("income-total");
  const expenseTotalElement = document.getElementById("expense-total");
  const chartCanvas = document.getElementById("chart");
  const themeToggler = document.getElementById("theme-toggler");
  const searchInput = document.getElementById("search");
  const filterSelect = document.getElementById("filter");
  const clearBtn = document.getElementById("clear-btn");

  // State
  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  // Initialize
  init();

  function init() {
    // Event Listeners
    transactionForm.addEventListener("submit", addTransaction);
    transactionList.addEventListener("click", removeTransaction);
    themeToggler.addEventListener("click", toggleTheme);
    searchInput.addEventListener("input", updateTransactionList);
    filterSelect.addEventListener("change", updateTransactionList);
    clearBtn.addEventListener("click", clearAllTransactions);

    // Check saved theme
    checkTheme();

    // Initial UI update
    updateValues();
    updateTransactionList();
    updateChart();
  }

  // Format currency as Rands
  function formatCurrency(amount) {
    return "R" + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
  }

  // Get category icon with all required categories
  function getCategoryIcon(category) {
    const icons = {
      food: "🍔",
      transport: "🚗",
      housing: "🏠",
      shopping: "🛍️",
      entertainment: "🎬",
      salary: "💰",
      party: "🎉",
      work: "💼",
      travel: "✈️",
      "break fast": "🍳",
      other: "❓",
    };
    // Handle case variations and spaces
    const normalizedCategory = category.trim();
    return icons[normalizedCategory] || icons.other;
  }

  // Add new transaction with proper category handling
  function addTransaction(e) {
    e.preventDefault();

    if (
      descriptionInput.value.trim() === "" ||
      amountInput.value.trim() === ""
    ) {
      alert("Please enter both description and amount");
      return;
    }

    const transaction = {
      id: generateID(),
      description: descriptionInput.value.trim(),
      amount: +amountInput.value,
      category: categoryInput.value, // Save selected category
      type: typeInput.value,
      date: new Date().toISOString(),
    };

    transactions.unshift(transaction);
    updateLocalStorage();
    updateValues();
    updateTransactionList();
    updateChart();

    // Reset form
    descriptionInput.value = "";
    amountInput.value = "";
    descriptionInput.focus();
  }

  // Generate random ID
  function generateID() {
    return Math.floor(Math.random() * 100000000);
  }

  // Remove transaction
  function removeTransaction(e) {
    if (e.target.classList.contains("delete-btn")) {
      if (confirm("Are you sure you want to delete this transaction?")) {
        const id = parseInt(e.target.parentElement.getAttribute("data-id"));
        transactions = transactions.filter((t) => t.id !== id);
        updateLocalStorage();
        updateValues();
        updateTransactionList();
        updateChart();
      }
    }
  }

  // Clear all transactions
  function clearAllTransactions() {
    if (transactions.length === 0) return;

    if (
      confirm(
        "Are you sure you want to delete ALL transactions? This cannot be undone."
      )
    ) {
      transactions = [];
      updateLocalStorage();
      updateValues();
      updateTransactionList();
      updateChart();
    }
  }

  // Update balance, income, expense totals
  function updateValues() {
    const amounts = transactions.map((t) =>
      t.type === "income" ? t.amount : -t.amount
    );
    const total = amounts.reduce((acc, val) => acc + val, 0);
    const income = amounts
      .filter((a) => a > 0)
      .reduce((acc, val) => acc + val, 0);
    const expense = Math.abs(
      amounts.filter((a) => a < 0).reduce((acc, val) => acc + val, 0)
    );

    balanceElement.textContent = formatCurrency(total);
    incomeTotalElement.textContent = formatCurrency(income);
    expenseTotalElement.textContent = formatCurrency(expense);
  }

  // Update transaction list with proper category icons
  function updateTransactionList() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterType = filterSelect.value;

    let filteredTransactions = transactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchTerm) ||
        t.category.toLowerCase().includes(searchTerm);
      const matchesFilter = filterType === "all" || t.type === filterType;
      return matchesSearch && matchesFilter;
    });

    transactionList.innerHTML = "";

    if (filteredTransactions.length === 0) {
      transactionList.innerHTML = "<li>No transactions found</li>";
      return;
    }

    filteredTransactions.forEach((t) => {
      const sign = t.type === "income" ? "+" : "-";
      const icon = getCategoryIcon(t.category);

      const li = document.createElement("li");
      li.className = t.type;
      li.setAttribute("data-id", t.id);

      li.innerHTML = `
                <div>
                    <span class="category-icon">${icon}</span>
                    <span>${t.description}</span>
                </div>
                <span>${sign}${formatCurrency(Math.abs(t.amount))}</span>
                <button class="delete-btn">×</button>
            `;

      transactionList.appendChild(li);
    });
  }

  // Update chart with categorized expenses
  function updateChart() {
    const ctx = chartCanvas.getContext("2d");

    // Clear previous chart
    if (window.myChart) {
      window.myChart.destroy();
    }

    // Prepare data for chart (expenses only)
    const expenses = transactions.filter((t) => t.type === "expense");
    if (expenses.length === 0) {
      chartCanvas.style.display = "none";
      return;
    }

    chartCanvas.style.display = "block";

    // Group by category
    const categoryData = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const labels = Object.keys(categoryData).map((cat) => {
      const icon = getCategoryIcon(cat);
      return `${icon} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
    });
    const data = Object.values(categoryData);

    // Create chart
    window.myChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
              "#8AC24A",
            ],
            borderColor: document.body.classList.contains("dark-mode")
              ? "#2d2d2d"
              : "#fff",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: document.body.classList.contains("dark-mode")
                ? "#f5f5f5"
                : "#666",
            },
          },
        },
      },
    });
  }

  // Theme functionality
  function checkTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      themeToggler.textContent = "☀️";
    }
  }

  function toggleTheme() {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggler.textContent = isDark ? "☀️" : "🌙";

    // Update chart colors if exists
    if (window.myChart) {
      window.myChart.options.plugins.legend.labels.color = isDark
        ? "#f5f5f5"
        : "#666";
      window.myChart.update();
    }
  }

  // Update localStorage
  function updateLocalStorage() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }
});
