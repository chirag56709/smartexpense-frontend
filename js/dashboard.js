const API_BASE_URL = "https://smartexpense-backend.vercel.app";

/* AUTH */
const userId = localStorage.getItem("userId");
if (!userId) {
  alert("Please login first!");
  window.location.href = "login.html";
}

/* LOGOUT */
document.getElementById("logoutBtn").onclick = () => {
  localStorage.removeItem("userId");
  window.location.href = "login.html";
};

/* ELEMENTS */
const incomeInput = document.getElementById("incomeInput");
const saveIncomeBtn = document.getElementById("saveIncome");
const resetIncomeBtn = document.getElementById("resetIncome");

const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");
const balance = document.getElementById("balance");

const expenseForm = document.getElementById("expenseForm");
const expenseTable = document.getElementById("expenseTable");

const monthFilter = document.getElementById("monthFilter");
const yearFilter = document.getElementById("yearFilter");

/* STATE */
let income = 0;
let expenses = [];

/* MONTH + YEAR SETUP */
const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

months.forEach((m, i) => {
  monthFilter.innerHTML += `<option value="${i}">${m}</option>`;
});

const currentYear = new Date().getFullYear();
for (let y = currentYear - 5; y <= currentYear + 5; y++) {
  yearFilter.innerHTML += `<option value="${y}">${y}</option>`;
}

monthFilter.value = new Date().getMonth();
yearFilter.value = currentYear;

/* FETCH DATA */
async function fetchData() {
  try {
    const incomeRes = await fetch(`${API_BASE_URL}/api/income/${userId}`);
    const incomeData = await incomeRes.json();

    income = incomeData.income || 0;
    incomeInput.value = income;
    totalIncome.textContent = `₹${income}`;

    const expRes = await fetch(`${API_BASE_URL}/api/expense/${userId}`);
    expenses = await expRes.json();

    renderExpenses();
  } catch (err) {
    console.error("Fetch error:", err);
    alert("Failed to load data");
  }
}

/* SAVE INCOME ✅ (THIS WAS MISSING) */
saveIncomeBtn.onclick = async () => {
  const newIncome = Number(incomeInput.value);

  if (isNaN(newIncome)) {
    alert("Invalid income");
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/income/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ income: newIncome })
    });

    const data = await res.json();

    income = data.income;
    totalIncome.textContent = `₹${income}`;
    renderExpenses();

    alert("Income saved");
  } catch (err) {
    console.error("Income save error:", err);
    alert("Failed to save income");
  }
};

/* RESET INCOME */
resetIncomeBtn.onclick = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/income/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ income: 0 })
    });

    const data = await res.json();

    income = data.income;
    incomeInput.value = 0;
    totalIncome.textContent = "₹0";
    renderExpenses();
  } catch (err) {
    console.error(err);
  }
};

/* RENDER EXPENSES */
function renderExpenses() {
  expenseTable.innerHTML = "";

  const m = Number(monthFilter.value);
  const y = Number(yearFilter.value);

  const filtered = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === m && d.getFullYear() === y;
  });

  let totalExp = 0;

  filtered.forEach(exp => {
    totalExp += exp.amount;
    expenseTable.innerHTML += `
      <tr>
        <td>${exp.title}</td>
        <td>${exp.category}</td>
        <td>₹${exp.amount}</td>
        <td>${exp.date}</td>
        <td>
          <button onclick="editExpense('${exp._id}')">Edit</button>
          <button class="danger" onclick="deleteExpense('${exp._id}')">Delete</button>
        </td>
      </tr>
    `;
  });

  totalExpenses.textContent = `₹${totalExp}`;
  balance.textContent = `₹${income - totalExp}`;
}

/* FILTER EVENTS */
monthFilter.onchange = renderExpenses;
yearFilter.onchange = renderExpenses;

/* ADD EXPENSE */
expenseForm.onsubmit = async (e) => {
  e.preventDefault();

  const expense = {
    title: title.value,
    category: category.value,
    amount: Number(amount.value),
    date: date.value
  };

  await fetch(`${API_BASE_URL}/api/expense/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense)
  });

  expenseForm.reset();
  fetchData();
};

/* EDIT EXPENSE */
window.editExpense = async (id) => {
  const exp = expenses.find(e => e._id === id);
  if (!exp) return;

  const amount = prompt("Edit amount", exp.amount);
  if (!amount) return;

  await fetch(`${API_BASE_URL}/api/expense/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Number(amount) })
  });

  fetchData();
};

/* DELETE EXPENSE */
window.deleteExpense = async (id) => {
  if (!confirm("Delete expense?")) return;

  await fetch(`${API_BASE_URL}/api/expense/${id}`, { method: "DELETE" });
  fetchData();
};

/* THEME TOGGLE */
const themeToggle = document.getElementById("themeToggle");

function setTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "🌙";
  }
  localStorage.setItem("theme", theme);
}

setTheme(localStorage.getItem("theme") || "light");

themeToggle.onclick = () => {
  setTheme(document.body.classList.contains("dark") ? "light" : "dark");
};

/* INIT */
fetchData();
