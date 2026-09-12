// ============================================================================
// Haushaltsbuch - App-Logik
// ============================================================================

// ---- Kategorien (bei Bedarf hier anpassen/erweitern) ----------------------
const CATEGORIES = [
  { name: "Gehalt / Hauptberuf", type: "Einnahme", klasse: "Einnahme" },
  { name: "Nebeneinkommen", type: "Einnahme", klasse: "Einnahme" },
  { name: "Sonstige Einnahmen", type: "Einnahme", klasse: "Einnahme" },

  { name: "Miete & Nebenkosten", type: "Ausgabe", klasse: "Fix" },
  { name: "Versicherungen", type: "Ausgabe", klasse: "Fix" },
  { name: "Mobilität / Auto", type: "Ausgabe", klasse: "Fix" },
  { name: "Sonstige Fixkosten", type: "Ausgabe", klasse: "Fix" },

  { name: "Lebensmittel", type: "Ausgabe", klasse: "Variabel" },
  { name: "Freizeit & Hobbys", type: "Ausgabe", klasse: "Variabel" },
  { name: "Essen gehen", type: "Ausgabe", klasse: "Variabel" },
  { name: "Kleidung & Schuhe", type: "Ausgabe", klasse: "Variabel" },
  { name: "Gesundheit & Körperpflege", type: "Ausgabe", klasse: "Variabel" },
  { name: "Haushaltsbedarf", type: "Ausgabe", klasse: "Variabel" },
  { name: "Sonstiges", type: "Ausgabe", klasse: "Variabel" },
];

const PIE_COLORS = ["#2E5FA3", "#BF8F00", "#2E7D32", "#C00000", "#6B4C9A",
                     "#0E7C86", "#B85C38", "#4C6EF5", "#A65D9E", "#5A7D2A",
                     "#C97A2B", "#3E6E6E", "#8C4B4B", "#5C6BC0"];

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let transactions = [];
let pieChart = null;
let barChart = null;

// ---- DOM references ---------------------------------------------------
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const authForm = document.getElementById("auth-form");
const authError = document.getElementById("auth-error");
const btnLogin = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");
const btnLogout = document.getElementById("btn-logout");
const userEmailEl = document.getElementById("user-email");

const txForm = document.getElementById("tx-form");
const txDate = document.getElementById("tx-date");
const txType = document.getElementById("tx-type");
const txCategory = document.getElementById("tx-category");
const txDescription = document.getElementById("tx-description");
const txAmount = document.getElementById("tx-amount");
const txError = document.getElementById("tx-error");
const txTbody = document.getElementById("tx-tbody");
const txEmpty = document.getElementById("tx-empty");

const eur = (n) => (n || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

// ============================================================================
// AUTH
// ============================================================================

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    onLoggedIn(session.user);
  } else {
    showAuthScreen();
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      onLoggedIn(session.user);
    } else {
      currentUser = null;
      showAuthScreen();
    }
  });
}

function showAuthScreen() {
  authScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
}

function onLoggedIn(user) {
  currentUser = user;
  userEmailEl.textContent = user.email;
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  populateCategorySelect();
  txDate.value = new Date().toISOString().slice(0, 10);
  loadTransactions();
}

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  await handleAuth("login");
});

btnSignup.addEventListener("click", async () => {
  await handleAuth("signup");
});

async function handleAuth(mode) {
  authError.textContent = "";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const action = mode === "signup"
    ? supabase.auth.signUp({ email, password })
    : supabase.auth.signInWithPassword({ email, password });

  const { data, error } = await action;

  if (error) {
    authError.textContent = translateAuthError(error.message);
    return;
  }
  if (mode === "signup" && data.user && !data.session) {
    authError.style.color = "#2E7D32";
    authError.textContent = "Konto erstellt! Falls Supabase Bestätigungs-E-Mails verlangt, prüfe dein Postfach und melde dich danach an.";
  }
}

function translateAuthError(msg) {
  if (/invalid login credentials/i.test(msg)) return "E-Mail oder Passwort ist falsch.";
  if (/already registered/i.test(msg)) return "Für diese E-Mail existiert bereits ein Konto - bitte anmelden.";
  if (/password should be at least/i.test(msg)) return "Das Passwort muss mindestens 6 Zeichen haben.";
  return msg;
}

btnLogout.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

// ============================================================================
// KATEGORIEN-DROPDOWN
// ============================================================================

function populateCategorySelect() {
  const type = txType.value;
  const options = CATEGORIES.filter((c) => c.type === type);
  txCategory.innerHTML = options
    .map((c) => `<option value="${c.name}">${c.name}</option>`)
    .join("");
}

txType.addEventListener("change", populateCategorySelect);

// ============================================================================
// TRANSAKTIONEN: LADEN, ANLEGEN, LÖSCHEN
// ============================================================================

async function loadTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    txError.textContent = "Buchungen konnten nicht geladen werden: " + error.message;
    return;
  }
  transactions = data || [];
  renderTransactions();
  renderKpis();
  renderCharts();
}

txForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  txError.textContent = "";

  const payload = {
    user_id: currentUser.id,
    date: txDate.value,
    type: txType.value,
    category: txCategory.value,
    description: txDescription.value.trim(),
    amount: parseFloat(txAmount.value),
  };

  if (!payload.date || !payload.category || isNaN(payload.amount) || payload.amount <= 0) {
    txError.textContent = "Bitte Datum, Kategorie und einen Betrag größer 0 angeben.";
    return;
  }

  const { error } = await supabase.from("transactions").insert(payload);
  if (error) {
    txError.textContent = "Speichern fehlgeschlagen: " + error.message;
    return;
  }

  txDescription.value = "";
  txAmount.value = "";
  await loadTransactions();
});

async function deleteTransaction(id) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) {
    alert("Löschen fehlgeschlagen: " + error.message);
    return;
  }
  await loadTransactions();
}

// ============================================================================
// RENDERING: TABELLE
// ============================================================================

function renderTransactions() {
  txTbody.innerHTML = "";
  txEmpty.classList.toggle("hidden", transactions.length > 0);

  for (const t of transactions) {
    const tr = document.createElement("tr");
    const amountClass = t.type === "Einnahme" ? "amount-income" : "amount-expense";
    const sign = t.type === "Einnahme" ? "+" : "-";
    tr.innerHTML = `
      <td>${formatDate(t.date)}</td>
      <td>${t.type}</td>
      <td>${t.category}</td>
      <td>${t.description || ""}</td>
      <td class="col-amount ${amountClass}">${sign} ${eur(t.amount)}</td>
      <td><button class="btn btn-danger" data-id="${t.id}">Löschen</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () => {
      if (confirm("Diese Buchung wirklich löschen?")) deleteTransaction(t.id);
    });
    txTbody.appendChild(tr);
  }
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// ============================================================================
// RENDERING: KPI-KARTEN (aktueller Monat)
// ============================================================================

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyOf(dateStr) {
  return dateStr.slice(0, 7);
}

function renderKpis() {
  const mKey = currentMonthKey();
  const monthTx = transactions.filter((t) => monthKeyOf(t.date) === mKey);

  const income = sum(monthTx.filter((t) => t.type === "Einnahme"));
  const expense = sum(monthTx.filter((t) => t.type === "Ausgabe"));
  const balance = income - expense;
  const rate = income > 0 ? (balance / income) * 100 : 0;

  document.getElementById("kpi-income").textContent = eur(income);
  document.getElementById("kpi-expense").textContent = eur(expense);
  document.getElementById("kpi-balance").textContent = eur(balance);
  document.getElementById("kpi-rate").textContent = rate.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " %";
}

function sum(list) {
  return list.reduce((acc, t) => acc + Number(t.amount), 0);
}

// ============================================================================
// RENDERING: DIAGRAMME
// ============================================================================

function renderCharts() {
  renderPieChart();
  renderBarChart();
}

function renderPieChart() {
  const mKey = currentMonthKey();
  const monthExpenses = transactions.filter(
    (t) => t.type === "Ausgabe" && monthKeyOf(t.date) === mKey
  );

  const byCategory = {};
  for (const t of monthExpenses) {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
  }

  const labels = Object.keys(byCategory);
  const values = Object.values(byCategory);

  const ctx = document.getElementById("chart-pie").getContext("2d");
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels.length ? labels : ["Keine Ausgaben diesen Monat"],
      datasets: [{
        data: values.length ? values : [1],
        backgroundColor: labels.length ? PIE_COLORS : ["#E1E5EE"],
      }],
    },
    options: {
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } },
    },
  });
}

function renderBarChart() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
    });
  }

  const incomeData = months.map((m) =>
    sum(transactions.filter((t) => t.type === "Einnahme" && monthKeyOf(t.date) === m.key))
  );
  const expenseData = months.map((m) =>
    sum(transactions.filter((t) => t.type === "Ausgabe" && monthKeyOf(t.date) === m.key))
  );

  const ctx = document.getElementById("chart-bar").getContext("2d");
  if (barChart) barChart.destroy();
  barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months.map((m) => m.label),
      datasets: [
        { label: "Einnahmen", data: incomeData, backgroundColor: "#2E7D32" },
        { label: "Ausgaben", data: expenseData, backgroundColor: "#C00000" },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

// ============================================================================
init();
