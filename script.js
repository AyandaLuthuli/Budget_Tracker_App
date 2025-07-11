document.addEventListener("DOMContentLoaded", function () {
  const transactionForm = document.getElementById("transaction-form");
  const descriptionInput = document.getElementById("description");
  const amountInput = document.getElementById("amount");
  const typeInput = document.getElementById("type");
  const transactionList = document.getElementById("transaction-list");
  const balanceElement = document.getElementById("balance");
  const incomeTotalElement = document.getElementById("income-total");
  const expenseTotalElement = document.getElementById("expense-total");
  const chartCanvas = document.getElementById("chart");

  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  // Format currency for South African Rand
  function formatCurrency(amount) {
    return "R" + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
  }

  // Initialize the app
  function init() {
    transactionForm.addEventListener("submit", addTransaction);
    transactionList.addEventListener("click", removeTransaction);
    updateValues();
    updateTransactionList();
    updateChart();
  }

  // Add a new transaction
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
      description: descriptionInput.value,
      amount: +amountInput.value,
      type: typeInput.value,
    };

    transactions.push(transaction);
    updateLocalStorage();
    updateValues();
    updateTransactionList();
    updateChart();

    // Clear form
    descriptionInput.value = "";
    amountInput.value = "";
  }

  // Generate random ID
  function generateID() {
    return Math.floor(Math.random() * 100000000);
  }

  // Remove transaction by ID
  function removeTransaction(e) {
    if (e.target.classList.contains("delete-btn")) {
      const id = parseInt(e.target.parentElement.getAttribute("data-id"));
      transactions = transactions.filter(
        (transaction) => transaction.id !== id
      );
      updateLocalStorage();
      updateValues();
      updateTransactionList();
      updateChart();
    }
  }

  // Update the balance, income, and expense values
  function updateValues() {
    const amounts = transactions.map((transaction) =>
      transaction.type === "income" ? transaction.amount : -transaction.amount
    );

    const total = amounts.reduce((acc, item) => acc + item, 0);
    const income = amounts
      .filter((item) => item > 0)
      .reduce((acc, item) => acc + item, 0);
    const expense =
      amounts.filter((item) => item < 0).reduce((acc, item) => acc + item, 0) *
      -1;

    balanceElement.textContent = formatCurrency(total);
    incomeTotalElement.textContent = formatCurrency(income);
    expenseTotalElement.textContent = formatCurrency(expense);
  }

  // Update the transaction list UI
  function updateTransactionList() {
    transactionList.innerHTML = "";

    if (transactions.length === 0) {
      transactionList.innerHTML = "<li>No transactions yet</li>";
      return;
    }

    transactions.forEach((transaction) => {
      const sign = transaction.type === "income" ? "+" : "-";
      const item = document.createElement("li");
      item.classList.add(transaction.type);
      item.setAttribute("data-id", transaction.id);

      item.innerHTML = `
                <span>${transaction.description}</span>
                <span>${sign}${formatCurrency(
        Math.abs(transaction.amount)
      )}</span>
                <button class="delete-btn">x</button>
            `;

      transactionList.appendChild(item);
    });
  }

  // Update localStorage
  function updateLocalStorage() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }

  // Update the chart
  function updateChart() {
    const ctx = chartCanvas.getContext("2d");

    // Clear previous chart if it exists
    if (window.myChart) {
      window.myChart.destroy();
    }

    // Group transactions by description and sum amounts
    const expenseData = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, curr) => {
        if (!acc[curr.description]) {
          acc[curr.description] = 0;
        }
        acc[curr.description] += curr.amount;
        return acc;
      }, {});

    const labels = Object.keys(expenseData);
    const data = Object.values(expenseData);

    if (labels.length === 0) {
      chartCanvas.style.display = "none";
      return;
    }

    chartCanvas.style.display = "block";

    // Create a simple pie chart
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
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        tooltips: {
          callbacks: {
            label: function (tooltipItem, data) {
              const value = data.datasets[0].data[tooltipItem.index];
              return `${data.labels[tooltipItem.index]}: ${formatCurrency(
                value
              )}`;
            },
          },
        },
      },
    });
  }

  // Initialize the app
  init();
});
