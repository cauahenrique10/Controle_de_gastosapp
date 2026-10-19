/* ═══════════════════════════════════════════════════════════════
   CONTROLE DE GASTOS — Frontend Application
   ═══════════════════════════════════════════════════════════════ */

// ── Constants ──
const CATEGORY_EMOJIS = {
    'Alimentação': '🍔',
    'Transporte': '🚗',
    'Moradia': '🏠',
    'Lazer': '🎮',
    'Educação': '📚',
    'Saúde': '🏥',
    'Compras': '🛒',
    'Outros': '📦'
};

const CATEGORY_COLORS = {
    'Alimentação': '#ff6b6b',
    'Transporte': '#ffd93d',
    'Moradia': '#6bcb77',
    'Lazer': '#7c5cfc',
    'Educação': '#4d96ff',
    'Saúde': '#ff8ec8',
    'Compras': '#00d9a6',
    'Outros': '#8b8b9e'
};

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// ── State ──
let state = {
    currentView: 'dashboard',
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    categories: [],
    editingExpenseId: null
};

// ── Charts ──
let categoryChart = null;
let dailyChart = null;


// ═══════════════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    setupNavigation();
    setupModal();
    setupFilters();
    setupBudgetForm();
    setupMobileMenu();
    await loadDashboard();
});


// ═══════════════════════════════════════════════════════════════
//  API HELPERS
// ═══════════════════════════════════════════════════════════════

async function api(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erro na requisição');
        }
        return data;
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

async function loadCategories() {
    state.categories = await api('/api/categories');
    populateCategorySelects();
}

function populateCategorySelects() {
    const selects = [
        document.getElementById('expense-category'),
        document.getElementById('filter-category'),
        document.getElementById('budget-category')
    ];

    selects.forEach(select => {
        if (!select) return;
        const isFilter = select.id === 'filter-category';
        const currentValue = select.value;

        // Keep the first option
        while (select.options.length > 1) select.remove(1);

        state.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = `${CATEGORY_EMOJIS[cat] || ''} ${cat}`;
            select.appendChild(option);
        });

        if (currentValue) select.value = currentValue;
    });
}


// ═══════════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════════

function setupNavigation() {
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            navigateTo(view);
        });
    });
}

function navigateTo(view) {
    state.currentView = view;

    // Update nav links
    document.querySelectorAll('.nav-link[data-view]').forEach(link => {
        link.classList.toggle('active', link.dataset.view === view);
    });

    // Show/hide views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.toggle('active', v.id === `view-${view}`);
    });

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');

    // Load data for the view
    switch (view) {
        case 'dashboard': loadDashboard(); break;
        case 'expenses': loadExpenses(); break;
        case 'budgets': loadBudgets(); break;
    }
}


// ═══════════════════════════════════════════════════════════════
//  MOBILE MENU
// ═══════════════════════════════════════════════════════════════

function setupMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
}


// ═══════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════

async function loadDashboard() {
    updateMonthLabel();

    const summary = await api(`/api/summary?year=${state.currentYear}&month=${state.currentMonth}`);

    // Update summary cards
    document.getElementById('total-month').textContent = formatCurrency(summary.total);
    document.getElementById('total-transactions').textContent = summary.total_transactions;

    if (summary.categories.length > 0) {
        document.getElementById('top-category').textContent =
            `${CATEGORY_EMOJIS[summary.categories[0].category] || ''} ${summary.categories[0].category}`;

        const daysInMonth = new Date(state.currentYear, state.currentMonth, 0).getDate();
        const currentDay = (state.currentYear === new Date().getFullYear() && state.currentMonth === new Date().getMonth() + 1)
            ? new Date().getDate() : daysInMonth;
        const avg = summary.total / currentDay;
        document.getElementById('daily-avg').textContent = formatCurrency(avg);
    } else {
        document.getElementById('top-category').textContent = '—';
        document.getElementById('daily-avg').textContent = 'R$ 0,00';
    }

    // Render charts
    renderCategoryChart(summary.categories);
    renderDailyChart(summary.daily);

    // Budget alerts
    renderBudgetAlerts(summary.categories);

    // Month navigation
    document.getElementById('prev-month').onclick = () => {
        state.currentMonth--;
        if (state.currentMonth < 1) { state.currentMonth = 12; state.currentYear--; }
        loadDashboard();
    };
    document.getElementById('next-month').onclick = () => {
        state.currentMonth++;
        if (state.currentMonth > 12) { state.currentMonth = 1; state.currentYear++; }
        loadDashboard();
    };
}

function updateMonthLabel() {
    document.getElementById('month-label').textContent =
        `${MONTH_NAMES[state.currentMonth - 1]} ${state.currentYear}`;
}


// ═══════════════════════════════════════════════════════════════
//  CHARTS
// ═══════════════════════════════════════════════════════════════

function renderCategoryChart(categories) {
    const canvas = document.getElementById('chart-category');
    const empty = document.getElementById('chart-category-empty');

    if (categories.length === 0) {
        canvas.style.display = 'none';
        empty.style.display = 'block';
        if (categoryChart) { categoryChart.destroy(); categoryChart = null; }
        return;
    }

    canvas.style.display = 'block';
    empty.style.display = 'none';

    const labels = categories.map(c => c.category);
    const data = categories.map(c => c.total);
    const colors = categories.map(c => CATEGORY_COLORS[c.category] || '#8b8b9e');

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: 'rgba(11, 13, 26, 0.8)',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#7e7e9a',
                        font: { family: 'Inter', size: 12, weight: 500 },
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 10
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1d35',
                    titleFont: { family: 'Inter', size: 13, weight: 600 },
                    bodyFont: { family: 'Inter', size: 12 },
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.raw)}`
                    }
                }
            }
        }
    });
}

function renderDailyChart(daily) {
    const canvas = document.getElementById('chart-daily');
    const empty = document.getElementById('chart-daily-empty');

    if (!daily || daily.length === 0) {
        canvas.style.display = 'none';
        empty.style.display = 'block';
        if (dailyChart) { dailyChart.destroy(); dailyChart = null; }
        return;
    }

    canvas.style.display = 'block';
    empty.style.display = 'none';

    const labels = daily.map(d => {
        const parts = d.date.split('-');
        return `${parts[2]}/${parts[1]}`;
    });
    const data = daily.map(d => d.total);

    if (dailyChart) dailyChart.destroy();

    dailyChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos',
                data: data,
                backgroundColor: 'rgba(124, 92, 252, 0.4)',
                hoverBackgroundColor: 'rgba(124, 92, 252, 0.7)',
                borderColor: '#7c5cfc',
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a1d35',
                    titleFont: { family: 'Inter', size: 13, weight: 600 },
                    bodyFont: { family: 'Inter', size: 12 },
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        label: (ctx) => ` ${formatCurrency(ctx.raw)}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#7e7e9a',
                        font: { family: 'Inter', size: 11 },
                        maxRotation: 45
                    },
                    grid: { display: false },
                    border: { display: false }
                },
                y: {
                    ticks: {
                        color: '#7e7e9a',
                        font: { family: 'Inter', size: 11 },
                        callback: (val) => `R$${val}`
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.04)',
                        drawTicks: false
                    },
                    border: { display: false }
                }
            }
        }
    });
}


// ═══════════════════════════════════════════════════════════════
//  BUDGET ALERTS
// ═══════════════════════════════════════════════════════════════

function renderBudgetAlerts(categories) {
    const container = document.getElementById('budget-alerts');
    const list = document.getElementById('alerts-list');

    const alerts = categories.filter(c => c.percentage && c.percentage >= 80);

    if (alerts.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    list.innerHTML = alerts.map(alert => {
        const isDanger = alert.percentage >= 100;
        const level = isDanger ? 'danger' : 'warning';
        const icon = isDanger ? 'fa-circle-exclamation' : 'fa-triangle-exclamation';
        const msg = isDanger
            ? `<strong>${alert.category}</strong> ultrapassou o orçamento de <strong>${formatCurrency(alert.budget)}</strong> — gasto: <strong>${formatCurrency(alert.total)}</strong>`
            : `<strong>${alert.category}</strong> está em <strong>${alert.percentage}%</strong> do orçamento de <strong>${formatCurrency(alert.budget)}</strong>`;

        return `
            <div class="alert-item ${level}">
                <i class="fas ${icon} alert-icon"></i>
                <span class="alert-text">${msg}</span>
                <span class="alert-percent">${alert.percentage}%</span>
            </div>
        `;
    }).join('');
}


// ═══════════════════════════════════════════════════════════════
//  EXPENSES
// ═══════════════════════════════════════════════════════════════

async function loadExpenses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.start_date) params.set('start_date', filters.start_date);
    if (filters.end_date) params.set('end_date', filters.end_date);

    const expenses = await api(`/api/expenses?${params}`);
    renderExpensesTable(expenses);
}

function renderExpensesTable(expenses) {
    const tbody = document.getElementById('expenses-tbody');

    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">
                    <i class="fas fa-inbox"></i>
                    <p>Nenhum gasto encontrado</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = expenses.map(exp => {
        const color = CATEGORY_COLORS[exp.category] || '#8b8b9e';
        const emoji = CATEGORY_EMOJIS[exp.category] || '📦';
        const dateParts = exp.date.split('-');
        const dateFormatted = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

        return `
            <tr>
                <td>${dateFormatted}</td>
                <td>
                    <span class="category-tag">
                        <span class="category-dot" style="background:${color}"></span>
                        ${emoji} ${exp.category}
                    </span>
                </td>
                <td>${exp.description || '—'}</td>
                <td class="amount-cell">${formatCurrency(exp.amount)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-secondary btn-sm" onclick="editExpense(${exp.id})" title="Editar">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteExpense(${exp.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupFilters() {
    document.getElementById('btn-filter').addEventListener('click', () => {
        const category = document.getElementById('filter-category').value;
        const start_date = document.getElementById('filter-start').value;
        const end_date = document.getElementById('filter-end').value;
        loadExpenses({ category, start_date, end_date });
    });

    document.getElementById('btn-clear-filter').addEventListener('click', () => {
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-start').value = '';
        document.getElementById('filter-end').value = '';
        loadExpenses();
    });
}


// ═══════════════════════════════════════════════════════════════
//  EXPENSE MODAL
// ═══════════════════════════════════════════════════════════════

function setupModal() {
    const modal = document.getElementById('expense-modal');
    const form = document.getElementById('expense-form');

    // Open modal
    document.getElementById('btn-add-expense').addEventListener('click', () => {
        state.editingExpenseId = null;
        document.getElementById('modal-title').textContent = 'Novo Gasto';
        form.reset();
        document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
        modal.classList.add('active');
    });

    // Close modal
    const closeModal = () => {
        modal.classList.remove('active');
        state.editingExpenseId = null;
    };
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Submit form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            amount: parseFloat(document.getElementById('expense-amount').value),
            category: document.getElementById('expense-category').value,
            description: document.getElementById('expense-description').value,
            date: document.getElementById('expense-date').value
        };

        try {
            if (state.editingExpenseId) {
                await api(`/api/expenses/${state.editingExpenseId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                showToast('Gasto atualizado com sucesso!', 'success');
            } else {
                await api('/api/expenses', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                showToast('Gasto adicionado com sucesso!', 'success');
            }

            closeModal();

            // Refresh current view
            if (state.currentView === 'expenses') loadExpenses();
            if (state.currentView === 'dashboard') loadDashboard();
        } catch (err) {
            // Error already handled by api()
        }
    });
}

async function editExpense(id) {
    try {
        const expenses = await api('/api/expenses');
        const expense = expenses.find(e => e.id === id);
        if (!expense) {
            showToast('Gasto não encontrado', 'error');
            return;
        }

        state.editingExpenseId = id;
        document.getElementById('modal-title').textContent = 'Editar Gasto';
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-category').value = expense.category;
        document.getElementById('expense-description').value = expense.description || '';
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-modal').classList.add('active');
    } catch (err) {
        // Error handled by api()
    }
}

async function deleteExpense(id) {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) return;

    try {
        await api(`/api/expenses/${id}`, { method: 'DELETE' });
        showToast('Gasto excluído com sucesso!', 'success');
        if (state.currentView === 'expenses') loadExpenses();
        if (state.currentView === 'dashboard') loadDashboard();
    } catch (err) {
        // Error handled by api()
    }
}


// ═══════════════════════════════════════════════════════════════
//  BUDGETS
// ═══════════════════════════════════════════════════════════════

async function loadBudgets() {
    const budgets = await api('/api/budgets');
    const summary = await api(`/api/summary?year=${state.currentYear}&month=${state.currentMonth}`);
    const spentByCategory = {};
    summary.categories.forEach(c => { spentByCategory[c.category] = c.total; });

    renderBudgetCards(budgets, spentByCategory);
}

function renderBudgetCards(budgets, spentByCategory) {
    const grid = document.getElementById('budgets-grid');

    if (budgets.length === 0) {
        grid.innerHTML = `
            <div class="budget-empty">
                <i class="fas fa-bullseye"></i>
                <p>Nenhum orçamento definido</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = budgets.map(b => {
        const spent = spentByCategory[b.category] || 0;
        const pct = Math.min(Math.round((spent / b.monthly_limit) * 100), 100);
        const realPct = Math.round((spent / b.monthly_limit) * 100);
        const color = CATEGORY_COLORS[b.category] || '#8b8b9e';
        const emoji = CATEGORY_EMOJIS[b.category] || '📦';
        const barClass = realPct >= 100 ? 'danger' : realPct >= 80 ? 'warning' : '';

        return `
            <div class="budget-card">
                <div class="budget-card-header">
                    <span class="category-tag">
                        <span class="category-dot" style="background:${color}"></span>
                        ${emoji} ${b.category}
                    </span>
                    <button class="btn btn-danger btn-sm" onclick="deleteBudget(${b.id})" title="Excluir orçamento">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="budget-amounts">
                    <span class="budget-spent">${formatCurrency(spent)}</span>
                    <span class="budget-limit">de ${formatCurrency(b.monthly_limit)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${barClass}" style="width: ${pct}%"></div>
                </div>
                <div class="budget-percent">${realPct}% utilizado</div>
            </div>
        `;
    }).join('');
}

function setupBudgetForm() {
    document.getElementById('budget-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            category: document.getElementById('budget-category').value,
            monthly_limit: parseFloat(document.getElementById('budget-limit').value)
        };

        try {
            await api('/api/budgets', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showToast('Orçamento definido com sucesso!', 'success');
            document.getElementById('budget-form').reset();
            loadBudgets();
        } catch (err) {
            // Error handled by api()
        }
    });
}

async function deleteBudget(id) {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

    try {
        await api(`/api/budgets/${id}`, { method: 'DELETE' });
        showToast('Orçamento excluído com sucesso!', 'success');
        loadBudgets();
    } catch (err) {
        // Error handled by api()
    }
}


// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
