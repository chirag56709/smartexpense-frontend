const userId = localStorage.getItem("userId");
if (!userId) {
    alert("Please login first!");
    window.location.href = "login.html";
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("userId");
    window.location.href = "login.html";
});

// Elements
const incomeInput = document.getElementById("incomeInput");
const saveIncomeBtn = document.getElementById("saveIncome");
const resetIncomeBtn = document.getElementById("resetIncome");
const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");
const balance = document.getElementById("balance");
const expenseForm = document.getElementById("expenseForm");
const expenseTable = document.getElementById("expenseTable");

let income = 0;
let expenses = [];

/* ================= FETCH DATA ================= */

async function fetchData() {
    try {
        const resIncome = await fetch(`http://localhost:5000/api/income/${userId}`);
        const incomeData = await resIncome.json();
        income = incomeData.income || 0;
        totalIncome.textContent = `₹${income}`;
        incomeInput.value = income;

        const resExpenses = await fetch(`http://localhost:5000/api/expense/${userId}`);
        expenses = await resExpenses.json();

        renderExpenses();
        updateBalance();
    } catch (err) {
        console.error(err);
    }
}

/* ================= INCOME ================= */

saveIncomeBtn.addEventListener("click", async () => {
    income = Number(incomeInput.value) || 0;
    totalIncome.textContent = `₹${income}`;
    updateBalance();

    try {
        await fetch(`http://localhost:5000/api/income/${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ income })
        });
    } catch (err) {
        console.error(err);
    }
});

resetIncomeBtn.addEventListener("click", () => {
    income = 0;
    incomeInput.value = 0;
    totalIncome.textContent = `₹0`;
    updateBalance();
});

/* ================= ADD EXPENSE ================= */

expenseForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const category = document.getElementById("category").value;
    const amount = Number(document.getElementById("amount").value);
    const date = document.getElementById("date").value;

    const expense = { title, category, amount, date };
    expenses.push(expense);

    renderExpenses();
    updateBalance();

    try {
        await fetch(`http://localhost:5000/api/expense/${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expense)
        });
    } catch (err) {
        console.error(err);
    }

    expenseForm.reset();
});

/* ================= RENDER EXPENSES ================= */

function renderExpenses() {
    expenseTable.innerHTML = "";

    expenses.forEach((exp, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${exp.title}</td>
            <td>${exp.category}</td>
            <td>₹${exp.amount}</td>
            <td>${exp.date}</td>
            <td>
                <button onclick="editExpense(${index})">Edit</button>
                <button class="danger" onclick="deleteExpense(${index})">Delete</button>
            </td>
        `;
        expenseTable.appendChild(tr);
    });

    const totalExp = expenses.reduce((acc, e) => acc + e.amount, 0);
    totalExpenses.textContent = `₹${totalExp}`;
}

/* ================= EDIT EXPENSE (NEW) ================= */

window.editExpense = async function (index) {
    const exp = expenses[index];

    const title = prompt("Edit Title", exp.title);
    if (title === null) return;

    const category = prompt("Edit Category", exp.category);
    if (category === null) return;

    const amount = prompt("Edit Amount", exp.amount);
    if (amount === null || isNaN(amount)) return;

    const date = prompt("Edit Date (YYYY-MM-DD)", exp.date);
    if (date === null) return;

    expenses[index] = {
        ...exp,
        title,
        category,
        amount: Number(amount),
        date
    };

    renderExpenses();
    updateBalance();

    // OPTIONAL backend update
    try {
        await fetch(`http://localhost:5000/api/expense/${userId}/${index}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expenses[index])
        });
    } catch (err) {
        console.error(err);
    }
};

/* ================= DELETE EXPENSE ================= */

window.deleteExpense = function (index) {
    expenses.splice(index, 1);
    renderExpenses();
    updateBalance();
};

/* ================= BALANCE ================= */

function updateBalance() {
    const totalExp = expenses.reduce((acc, e) => acc + e.amount, 0);
    balance.textContent = `₹${income - totalExp}`;
}

/* ================= INIT ================= */

fetchData();
