/* ============================================================
   ExpenseIQ — Application Logic
   ============================================================ */

'use strict';

// ────────────────────────────────────────────────────────────
// CONSTANTS & DATA
// ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'expenseiq_data';

const CATEGORIES = {
  income: [
    { id: 'salary',      label: 'Salary',      icon: '💼' },
    { id: 'freelance',   label: 'Freelance',   icon: '💻' },
    { id: 'investment',  label: 'Investment',  icon: '📊' },
    { id: 'rental',      label: 'Rental',      icon: '🏠' },
    { id: 'gift',        label: 'Gift',         icon: '🎁' },
    { id: 'other_in',   label: 'Other',        icon: '💰' },
  ],
  expense: [
    { id: 'food',        label: 'Food & Dining', icon: '🍔' },
    { id: 'transport',   label: 'Transport',     icon: '🚗' },
    { id: 'shopping',    label: 'Shopping',      icon: '🛍' },
    { id: 'bills',       label: 'Bills',         icon: '📱' },
    { id: 'health',      label: 'Health',        icon: '💊' },
    { id: 'education',   label: 'Education',     icon: '📚' },
    { id: 'rent',        label: 'Rent',          icon: '🏡' },
    { id: 'travel',      label: 'Travel',        icon: '✈️' },
    { id: 'fitness',     label: 'Fitness',       icon: '🏋️' },
    { id: 'entertain',   label: 'Entertainment', icon: '🎬' },
    { id: 'savings_out', label: 'Savings',       icon: '🏦' },
    { id: 'other_ex',   label: 'Other',         icon: '💳' },
  ]
};

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CHART_COLORS = [
  '#5b8af5','#a855f7','#22d3a6','#f87171','#fbbf24','#fb923c',
  '#06b6d4','#ec4899','#84cc16','#14b8a6','#f59e0b','#6366f1'
];

// ────────────────────────────────────────────────────────────
// STATE
// ────────────────────────────────────────────────────────────

let transactions = [];
let currentType  = 'income';
let charts       = { donut: null, bar: null, category: null, trend: null };

// ────────────────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setDefaultDate();
  populateCategorySelect();
  populateFilterOptions();
  renderAll();
});

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    transactions = raw ? JSON.parse(raw) : getSampleData();
    if (!Array.isArray(transactions)) transactions = [];
  } catch {
    transactions = [];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function getSampleData() {
  const now = new Date();
  const yr  = now.getFullYear();
  const mo  = String(now.getMonth() + 1).padStart(2, '0');
  const prevMo = String(now.getMonth()).padStart(2, '0') || '12';

  return [
    { id: uid(), type: 'income',  amount: 5500,  description: 'Monthly Salary',      category: 'salary',    date: `${yr}-${mo}-01`, note: 'Regular paycheck', createdAt: Date.now()-6 },
    { id: uid(), type: 'income',  amount: 800,   description: 'Freelance Project',   category: 'freelance', date: `${yr}-${mo}-05`, note: '', createdAt: Date.now()-5 },
    { id: uid(), type: 'expense', amount: 1200,  description: 'Monthly Rent',        category: 'rent',      date: `${yr}-${mo}-02`, note: 'Apartment rent', createdAt: Date.now()-4 },
    { id: uid(), type: 'expense', amount: 320,   description: 'Grocery Shopping',    category: 'food',      date: `${yr}-${mo}-08`, note: 'Weekly groceries', createdAt: Date.now()-3 },
    { id: uid(), type: 'expense', amount: 85,    description: 'Netflix & Spotify',   category: 'entertain', date: `${yr}-${mo}-10`, note: '', createdAt: Date.now()-2 },
    { id: uid(), type: 'expense', amount: 120,   description: 'Gym Membership',      category: 'fitness',   date: `${yr}-${mo}-11`, note: 'Annual plan monthly', createdAt: Date.now()-1 },
    { id: uid(), type: 'income',  amount: 4800,  description: 'Previous Salary',     category: 'salary',    date: `${yr}-${prevMo}-01`, note: '', createdAt: Date.now()-10 },
    { id: uid(), type: 'expense', amount: 240,   description: 'Electricity Bill',    category: 'bills',     date: `${yr}-${prevMo}-15`, note: '', createdAt: Date.now()-9 },
    { id: uid(), type: 'expense', amount: 55,    description: 'Bus Pass',            category: 'transport', date: `${yr}-${prevMo}-02`, note: '', createdAt: Date.now()-8 },
    { id: uid(), type: 'expense', amount: 180,   description: 'New Shoes',           category: 'shopping',  date: `${yr}-${prevMo}-20`, note: 'Nike sneakers', createdAt: Date.now()-7 },
  ];
}

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatCurrency(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCategoryMeta(type, id) {
  const list = CATEGORIES[type] || [];
  return list.find(c => c.id === id) || { label: id, icon: type === 'income' ? '💰' : '💳' };
}

function setDefaultDate() {
  const dateInput = document.getElementById('entry-date');
  dateInput.value = new Date().toISOString().split('T')[0];
}

function getStats() {
  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const rate    = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  return { income, expense, balance, rate };
}

// ────────────────────────────────────────────────────────────
// NAVIGATION
// ────────────────────────────────────────────────────────────

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  document.getElementById(`nav-${name}`).classList.add('active');

  if (name === 'transactions') renderTransactions();
  if (name === 'analytics')    renderAnalytics();
}

// ────────────────────────────────────────────────────────────
// MODAL
// ────────────────────────────────────────────────────────────

function openModal(type) {
  const backdrop = document.getElementById('modal-backdrop');
  backdrop.classList.add('open');
  document.getElementById('entry-description').focus();
  setType(type || currentType);
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-backdrop')) return;
  document.getElementById('modal-backdrop').classList.remove('open');
  document.getElementById('entry-form').reset();
  setDefaultDate();
}

function setType(type) {
  currentType = type;
  document.getElementById('type-income').classList.toggle('active',  type === 'income');
  document.getElementById('type-expense').classList.toggle('active', type === 'expense');

  const submitBtn   = document.getElementById('submit-btn');
  const submitLabel = document.getElementById('submit-label');
  submitBtn.className = 'btn-submit ' + (type === 'income' ? 'income-submit' : 'expense-submit');
  submitLabel.textContent = type === 'income' ? '＋ Add Income' : '＋ Add Expense';

  populateCategorySelect();
}

function populateCategorySelect() {
  const sel  = document.getElementById('entry-category');
  const cats = CATEGORIES[currentType] || [];
  sel.innerHTML = `<option value="" disabled selected>Select a category</option>`;
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.icon} ${c.label}`;
    sel.appendChild(opt);
  });
}

// ────────────────────────────────────────────────────────────
// ADD ENTRY
// ────────────────────────────────────────────────────────────

function addEntry(e) {
  e.preventDefault();
  const desc   = document.getElementById('entry-description').value.trim();
  const amount = parseFloat(document.getElementById('entry-amount').value);
  const date   = document.getElementById('entry-date').value;
  const cat    = document.getElementById('entry-category').value;
  const note   = document.getElementById('entry-note').value.trim();

  if (!desc || !amount || amount <= 0 || !date || !cat) {
    showToast('Please fill all required fields correctly.', 'error');
    return;
  }

  const tx = { id: uid(), type: currentType, amount, description: desc, category: cat, date, note, createdAt: Date.now() };
  transactions.unshift(tx);
  saveData();

  document.getElementById('modal-backdrop').classList.remove('open');
  document.getElementById('entry-form').reset();
  setDefaultDate();

  renderAll();
  populateFilterOptions();
  showToast(`${currentType === 'income' ? '💚' : '🔴'} Entry added successfully!`, 'success');
}

// ────────────────────────────────────────────────────────────
// DELETE
// ────────────────────────────────────────────────────────────

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  renderAll();
  populateFilterOptions();
  showToast('Transaction deleted.', 'info');
}

function clearAllData() {
  if (!confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) return;
  transactions = [];
  saveData();
  renderAll();
  populateFilterOptions();
  showToast('All data cleared.', 'info');
}

// ────────────────────────────────────────────────────────────
// RENDER ALL
// ────────────────────────────────────────────────────────────

function renderAll() {
  renderSummary();
  renderRecentTransactions();
  renderDonutChart();
  renderBarChart();
}

// ────────────────────────────────────────────────────────────
// SUMMARY CARDS
// ────────────────────────────────────────────────────────────

function renderSummary() {
  const { income, expense, balance, rate } = getStats();
  const incomeCount  = transactions.filter(t => t.type === 'income').length;
  const expenseCount = transactions.filter(t => t.type === 'expense').length;

  animateValue('balance-amount', balance, true);
  animateValue('income-amount',  income,  false);
  animateValue('expense-amount', expense, false);

  document.getElementById('savings-rate').textContent   = rate + '%';
  document.getElementById('income-count').textContent   = incomeCount  + ' transaction' + (incomeCount  !== 1 ? 's' : '');
  document.getElementById('expense-count').textContent  = expenseCount + ' transaction' + (expenseCount !== 1 ? 's' : '');
  document.getElementById('balance-sub').textContent    = 'Updated just now';
  document.getElementById('savings-sub').textContent    = income > 0 ? 'of income saved' : 'Add income to track';
  document.getElementById('center-balance').textContent = formatCurrency(balance);
}

function animateValue(elemId, target, isBalance) {
  const el = document.getElementById(elemId);
  const start = 0;
  const duration = 600;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = start + (target - start) * eased;
    el.textContent = formatCurrency(val);
    if (isBalance && target < 0) el.style.color = 'var(--expense-color)';
    else if (isBalance) el.style.removeProperty('color');
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ────────────────────────────────────────────────────────────
// RECENT TRANSACTIONS (Dashboard)
// ────────────────────────────────────────────────────────────

function renderRecentTransactions() {
  const container = document.getElementById('recent-list');
  const recent    = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state" id="empty-recent">
        <div class="empty-icon">🪙</div>
        <h3>No transactions yet</h3>
        <p>Add your first income or expense to get started</p>
        <button class="btn-add-first" onclick="openModal()">＋ Add Entry</button>
      </div>`;
    return;
  }

  container.innerHTML = recent.map(t => buildTransactionHTML(t)).join('');
}

// ────────────────────────────────────────────────────────────
// ALL TRANSACTIONS (Transactions Tab)
// ────────────────────────────────────────────────────────────

function renderTransactions() {
  const typeFilter = document.getElementById('filter-type').value;
  const catFilter  = document.getElementById('filter-category').value;
  const monFilter  = document.getElementById('filter-month').value;
  const container  = document.getElementById('transactions-list');

  let filtered = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (typeFilter !== 'all') filtered = filtered.filter(t => t.type === typeFilter);
  if (catFilter  !== 'all') filtered = filtered.filter(t => t.category === catFilter);
  if (monFilter  !== 'all') filtered = filtered.filter(t => t.date.startsWith(monFilter));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No transactions found</h3>
        <p>Try adjusting your filters or add new entries</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(t => buildTransactionHTML(t)).join('');
}

function buildTransactionHTML(t) {
  const meta = getCategoryMeta(t.type, t.category);
  return `
    <div class="transaction-item" id="tx-${t.id}">
      <div class="tx-icon-wrap ${t.type === 'income' ? 'income-bg' : 'expense-bg'}">
        ${meta.icon}
      </div>
      <div class="tx-info">
        <div class="tx-desc">${escapeHTML(t.description)}</div>
        <div class="tx-meta">
          <span class="tx-date">${formatDate(t.date)}</span>
          <span class="tx-category">${meta.label}</span>
          ${t.note ? `<span class="tx-note">${escapeHTML(t.note)}</span>` : ''}
        </div>
      </div>
      <span class="tx-amount ${t.type}">
        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
      </span>
      <button class="tx-delete" onclick="deleteTransaction('${t.id}')" title="Delete transaction" aria-label="Delete transaction">✕</button>
    </div>`;
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ────────────────────────────────────────────────────────────
// FILTER OPTIONS
// ────────────────────────────────────────────────────────────

function populateFilterOptions() {
  // Category filter
  const catSel = document.getElementById('filter-category');
  const allCats = [...new Set(transactions.map(t => t.category))];
  catSel.innerHTML = `<option value="all">All Categories</option>`;
  allCats.forEach(cat => {
    const type = transactions.find(t => t.category === cat)?.type || 'expense';
    const meta = getCategoryMeta(type, cat);
    catSel.innerHTML += `<option value="${cat}">${meta.icon} ${meta.label}</option>`;
  });

  // Month filter
  const monSel = document.getElementById('filter-month');
  const allMonths = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();
  monSel.innerHTML = `<option value="all">All Time</option>`;
  allMonths.forEach(m => {
    const [yr, mo] = m.split('-');
    const label = `${MONTHS_SHORT[parseInt(mo,10)-1]} ${yr}`;
    monSel.innerHTML += `<option value="${m}">${label}</option>`;
  });
}

// ────────────────────────────────────────────────────────────
// CHARTS — DONUT
// ────────────────────────────────────────────────────────────

function renderDonutChart() {
  const { income, expense } = getStats();
  const ctx = document.getElementById('donutChart').getContext('2d');

  if (charts.donut) charts.donut.destroy();

  charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expenses'],
      datasets: [{
        data: income === 0 && expense === 0 ? [1, 0] : [income, expense],
        backgroundColor: ['rgba(34,211,166,0.85)', 'rgba(248,113,113,0.85)'],
        borderColor: ['#22d3a6', '#f87171'],
        borderWidth: 2,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#8b97b8',
            font: { family: 'Inter', size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${formatCurrency(ctx.raw)}`
          },
          backgroundColor: '#0e1525',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#8b97b8',
          padding: 12,
        }
      },
      animation: { animateRotate: true, duration: 700 }
    }
  });
}

// ────────────────────────────────────────────────────────────
// CHARTS — BAR (Monthly)
// ────────────────────────────────────────────────────────────

function renderBarChart() {
  const ctx = document.getElementById('barChart').getContext('2d');
  if (charts.bar) charts.bar.destroy();

  const { months, incomeData, expenseData } = getLast6MonthsData();

  charts.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: 'rgba(34,211,166,0.7)',
          borderColor: '#22d3a6',
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: 'rgba(248,113,113,0.7)',
          borderColor: '#f87171',
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#8b97b8',
            font: { family: 'Inter', size: 11 },
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
          }
        },
        tooltip: {
          callbacks: { label: ctx => ` ${formatCurrency(ctx.raw)}` },
          backgroundColor: '#0e1525',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#8b97b8',
          padding: 12,
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#8b97b8', font: { family: 'Inter', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#8b97b8',
            font: { family: 'Inter', size: 11 },
            callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(1)+'k' : v)
          }
        }
      },
      animation: { duration: 700 }
    }
  });
}

function getLast6MonthsData() {
  const now    = new Date();
  const months = [];
  const incomeData  = [];
  const expenseData = [];

  for (let i = 5; i >= 0; i--) {
    const d  = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${yr}-${mo}`;
    months.push(MONTHS_SHORT[d.getMonth()]);

    const mTx = transactions.filter(t => t.date.startsWith(key));
    incomeData.push(mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
    expenseData.push(mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
  }
  return { months, incomeData, expenseData };
}

// ────────────────────────────────────────────────────────────
// ANALYTICS
// ────────────────────────────────────────────────────────────

function renderAnalytics() {
  renderCategoryChart();
  renderTrendChart();
  renderTopCategories();
  renderMonthStats();
}

function renderCategoryChart() {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (charts.category) charts.category.destroy();

  const expenses = transactions.filter(t => t.type === 'expense');
  const catMap   = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  if (sorted.length === 0) {
    charts.category = null;
    ctx.canvas.parentElement.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:60px 0">No expense data</p>`;
    return;
  }

  const labels = sorted.map(([cat]) => getCategoryMeta('expense', cat).label);
  const data   = sorted.map(([, v]) => v);

  charts.category = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: CHART_COLORS.map(c => c + 'cc'),
        borderColor:     CHART_COLORS,
        borderWidth: 2,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#8b97b8',
            font: { family: 'Inter', size: 11 },
            padding: 10,
            usePointStyle: true,
            pointStyle: 'circle',
          }
        },
        tooltip: {
          callbacks: { label: ctx => ` ${formatCurrency(ctx.raw)}` },
          backgroundColor: '#0e1525',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#8b97b8',
          padding: 12,
        }
      },
      animation: { duration: 700 }
    }
  });
}

function renderTrendChart() {
  const ctx = document.getElementById('trendChart').getContext('2d');
  if (charts.trend) charts.trend.destroy();

  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sorted.length === 0) {
    charts.trend = null;
    return;
  }

  let running = 0;
  const labels = [];
  const data   = [];

  sorted.forEach(t => {
    running += t.type === 'income' ? t.amount : -t.amount;
    labels.push(formatDate(t.date));
    data.push(parseFloat(running.toFixed(2)));
  });

  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(91,138,245,0.3)');
  gradient.addColorStop(1, 'rgba(91,138,245,0)');

  charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Balance',
        data,
        borderColor: '#5b8af5',
        backgroundColor: gradient,
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#5b8af5',
        pointBorderColor: '#0e1525',
        pointBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` Balance: ${formatCurrency(ctx.raw)}` },
          backgroundColor: '#0e1525',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#f0f4ff',
          bodyColor: '#8b97b8',
          padding: 12,
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#8b97b8', font: { family: 'Inter', size: 10 }, maxTicksLimit: 8 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#8b97b8',
            font: { family: 'Inter', size: 11 },
            callback: v => '$' + (Math.abs(v) >= 1000 ? (v/1000).toFixed(1)+'k' : v)
          }
        }
      },
      animation: { duration: 700 }
    }
  });
}

function renderTopCategories() {
  const container = document.getElementById('top-categories-list');
  const expenses  = transactions.filter(t => t.type === 'expense');
  const catMap    = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max    = sorted[0]?.[1] || 1;

  if (sorted.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:30px 0">No expense data yet</p>`;
    return;
  }

  container.innerHTML = sorted.map(([cat, amount], i) => {
    const meta = getCategoryMeta('expense', cat);
    const pct  = Math.round((amount / max) * 100);
    return `
      <div class="top-cat-item">
        <div class="top-cat-rank">${i + 1}</div>
        <div class="top-cat-info">
          <div class="top-cat-name">${meta.icon} ${meta.label}</div>
          <div class="top-cat-bar-wrap">
            <div class="top-cat-bar" style="width:${pct}%"></div>
          </div>
        </div>
        <span class="top-cat-amount">${formatCurrency(amount)}</span>
      </div>`;
  }).join('');
}

function renderMonthStats() {
  const container = document.getElementById('month-stats');
  const now  = new Date();
  const key  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const mTx  = transactions.filter(t => t.date.startsWith(key));
  const inc  = mTx.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const exp  = mTx.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  const bal  = inc - exp;
  const monName = MONTHS_SHORT[now.getMonth()] + ' ' + now.getFullYear();

  container.innerHTML = `
    <div class="month-stat-row">
      <span class="month-stat-label">📈 Income — ${monName}</span>
      <span class="month-stat-value inc">${formatCurrency(inc)}</span>
    </div>
    <div class="month-stat-divider"></div>
    <div class="month-stat-row">
      <span class="month-stat-label">📉 Expenses</span>
      <span class="month-stat-value exp">${formatCurrency(exp)}</span>
    </div>
    <div class="month-stat-divider"></div>
    <div class="month-stat-row">
      <span class="month-stat-label">💰 Net Balance</span>
      <span class="month-stat-value bal">${bal >= 0 ? '+' : ''}${formatCurrency(bal)}</span>
    </div>
    <div class="month-stat-divider"></div>
    <div class="month-stat-row">
      <span class="month-stat-label">📊 Transactions</span>
      <span class="month-stat-value bal">${mTx.length}</span>
    </div>
    <div class="month-stat-divider"></div>
    <div class="month-stat-row">
      <span class="month-stat-label">🏆 Biggest Expense</span>
      <span class="month-stat-value exp">${mTx.filter(t=>t.type==='expense').length > 0 ? formatCurrency(Math.max(...mTx.filter(t=>t.type==='expense').map(t=>t.amount))) : '$0.00'}</span>
    </div>
  `;
}

// ────────────────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────────────────

let toastTimer;
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ────────────────────────────────────────────────────────────
// KEYBOARD SHORTCUT
// ────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'SELECT') {
    openModal();
  }
  if (e.key === 'Escape') {
    document.getElementById('modal-backdrop').classList.remove('open');
  }
});
