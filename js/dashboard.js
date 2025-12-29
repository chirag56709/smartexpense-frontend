const API_BASE_URL = "https://smartexpense-backend.vercel.app";

/******************** AUTH CHECK ********************/
const userId = localStorage.getItem("userId");
if (!userId) {
  alert("Please login first!");
  window.location.href = "login.html";
}

/******************** LOGOUT ********************/
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
});

/******************** ELEMENTS ********************/
const incomeInput = document.getElementById("incomeInput");
const saveIncomeBtn = document.getElementById("saveIncome");
const resetIncomeBtn = document.getElementById("resetIncome");

const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");
const balance = document.getElementById("balance");

const expenseForm = document.getElementById("expenseForm");
const expenseTable = document.getElementById("expenseTable");

/******************** STATE ********************/
let income = 0;
let expenses = [];

/******************** FETCH DATA ********************/
async function fetchData() {
  try {
    // FETCH INCOME
    const incomeRes = await fetch(`${API_BASE_URL}/api/income/${userId}`);
    const incomeData = await incomeRes.json();
    income = incomeData?.income || 0;
    incomeInput.value = income;
    totalIncome.textContent = `₹${income}`;

    // FETCH EXPENSES
    const expenseRes = await fetch(`${API_BASE_URL}/api/expense/${userId}`);
    expenses = await expenseRes.json();

    renderExpenses();
    updateBalance();
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Failed to load data from server");
  }
}

/******************** SAVE INCOME ********************/
saveIncomeBtn.addEventListener("click", async () => {
  income = Number(incomeInput.value) || 0;
  totalIncome.textContent = `₹${income}`;
  updateBalance();

  try {
    await fetch(`${API_BASE_URL}/api/income/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ income }),
    });
  } catch (err) {
    console.error("Income save error:", err);
  }
});

/******************** RESET INCOME ********************/
resetIncomeBtn.addEventListener("click", async () => {
  income = 0;
  incomeInput.value = 0;
  totalIncome.textContent = `₹0`;
  updateBalance();

  try {
    await fetch(`${API_BASE_URL}/api/income/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ income: 0 }),
    });
  } catch (err) {
    console.error("Reset income error:", err);
  }
});

/******************** ADD EXPENSE ********************/
expenseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const category = document.getElementById("category").value;
  const amount = Number(document.getElementById("amount").value);
  const date = document.getElementById("date").value;

  if (!title || !category || !amount || !date) {
    return alert("Fill all expense fields");
  }

  const expense = { userId, title, category, amount, date };

  try {
    const res = await fetch(`${API_BASE_URL}/api/expense/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });

    if (res.ok) {
      fetchData(); // reload from backend to ensure sync
      expenseForm.reset();
    }
  } catch (err) {
    console.error("Add expense error:", err);
  }
});

/******************** RENDER EXPENSES ********************/
function renderExpenses() {
  expenseTable.innerHTML = "";

  expenses.forEach((exp) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exp.title}</td>
      <td>${exp.category}</td>
      <td>₹${exp.amount}</td>
      <td>${exp.date}</td>
      <td>
        <button onclick="editExpense('${exp._id}')">Edit</button>
        <button class="danger" onclick="deleteExpense('${exp._id}')">Delete</button>
      </td>
    `;
    expenseTable.appendChild(tr);
  });

  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalExpenses.textContent = `₹${totalExp}`;
}

/******************** EDIT EXPENSE ********************/
window.editExpense = async function (expenseId) {
  const exp = expenses.find((e) => e._id === expenseId);
  if (!exp) return;

  const title = prompt("Edit Title", exp.title);
  if (title === null) return;

  const category = prompt("Edit Category", exp.category);
  if (category === null) return;

  const amount = prompt("Edit Amount", exp.amount);
  if (amount === null || isNaN(amount)) return;

  const date = prompt("Edit Date (YYYY-MM-DD)", exp.date);
  if (date === null) return;

  try {
    await fetch(`${API_BASE_URL}/api/expense/${expenseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        amount: Number(amount),
        date,
      }),
    });

    fetchData();
  } catch (err) {
    console.error("Edit expense error:", err);
  }
};

/******************** DELETE EXPENSE ********************/
window.deleteExpense = async function (expenseId) {
  if (!confirm("Delete this expense?")) return;

  try {
    await fetch(`${API_BASE_URL}/api/expense/${expenseId}`, { method: "DELETE" });
    fetchData();
  } catch (err) {
    console.error("Delete expense error:", err);
  }
};

/******************** BALANCE ********************/
function updateBalance() {
  const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
  balance.textContent = `₹${income - totalExp}`;
}

/******************** INIT ********************/
fetchData();
