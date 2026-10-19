import sqlite3
import os

DATABASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
DATABASE_PATH = os.path.join(DATABASE_DIR, 'gastos.db')


def get_connection():
    """Cria e retorna uma conexão com o banco de dados SQLite."""
    os.makedirs(DATABASE_DIR, exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Inicializa as tabelas do banco de dados."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT DEFAULT '',
            date TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL UNIQUE,
            monthly_limit REAL NOT NULL
        )
    ''')

    conn.commit()
    conn.close()


# ──────────────────────────── EXPENSES ────────────────────────────

def add_expense(amount, category, description, date):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO expenses (amount, category, description, date) VALUES (?, ?, ?, ?)',
        (amount, category, description, date)
    )
    conn.commit()
    expense_id = cursor.lastrowid
    conn.close()
    return expense_id


def get_expenses(category=None, start_date=None, end_date=None):
    conn = get_connection()
    cursor = conn.cursor()

    query = 'SELECT * FROM expenses WHERE 1=1'
    params = []

    if category:
        query += ' AND category = ?'
        params.append(category)
    if start_date:
        query += ' AND date >= ?'
        params.append(start_date)
    if end_date:
        query += ' AND date <= ?'
        params.append(end_date)

    query += ' ORDER BY date DESC, id DESC'

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_expense_by_id(expense_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM expenses WHERE id = ?', (expense_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_expense(expense_id, amount, category, description, date):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ?',
        (amount, category, description, date, expense_id)
    )
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


def delete_expense(expense_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM expenses WHERE id = ?', (expense_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0


# ──────────────────────────── SUMMARY ─────────────────────────────

def get_monthly_summary(year, month):
    conn = get_connection()
    cursor = conn.cursor()

    date_prefix = f"{year:04d}-{month:02d}"

    cursor.execute('''
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM expenses
        WHERE date LIKE ?
        GROUP BY category
        ORDER BY total DESC
    ''', (f"{date_prefix}%",))

    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_daily_totals(year, month):
    """Retorna os totais diários de um mês para o gráfico de barras."""
    conn = get_connection()
    cursor = conn.cursor()

    date_prefix = f"{year:04d}-{month:02d}"

    cursor.execute('''
        SELECT date, SUM(amount) as total
        FROM expenses
        WHERE date LIKE ?
        GROUP BY date
        ORDER BY date ASC
    ''', (f"{date_prefix}%",))

    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


# ──────────────────────────── BUDGETS ─────────────────────────────

def get_budgets():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM budgets ORDER BY category')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def set_budget(category, monthly_limit):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO budgets (category, monthly_limit) VALUES (?, ?)
        ON CONFLICT(category) DO UPDATE SET monthly_limit = ?
    ''', (category, monthly_limit, monthly_limit))
    conn.commit()
    conn.close()


def delete_budget(budget_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM budgets WHERE id = ?', (budget_id,))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0
