from flask import Flask, render_template, request, jsonify, Response
from datetime import date
import database as db
import csv
import io

app = Flask(__name__)
app.secret_key = 'mude-esta-chave-para-algo-seguro-e-unico'

# Inicializa o banco de dados ao importar (necessário para WSGI)
db.init_db()

CATEGORIES = [
    'Alimentação', 'Transporte', 'Moradia', 'Lazer',
    'Educação', 'Saúde', 'Compras', 'Outros'
]


# ──────────────────────────── PÁGINAS ─────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


# ──────────────────────────── API ─────────────────────────────────

@app.route('/api/categories')
def get_categories():
    return jsonify(CATEGORIES)


# ── Gastos ──

@app.route('/api/expenses', methods=['GET'])
def list_expenses():
    category = request.args.get('category')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    expenses = db.get_expenses(category, start_date, end_date)
    return jsonify(expenses)


@app.route('/api/expenses', methods=['POST'])
def create_expense():
    data = request.json

    if not data.get('amount') or not data.get('category') or not data.get('date'):
        return jsonify({'error': 'Campos obrigatórios: valor, categoria e data'}), 400

    try:
        amount = float(data['amount'])
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': 'Valor deve ser um número positivo'}), 400

    expense_id = db.add_expense(
        amount=amount,
        category=data['category'],
        description=data.get('description', ''),
        date=data['date']
    )
    return jsonify({'id': expense_id, 'message': 'Gasto adicionado com sucesso'}), 201


@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_expense_route(expense_id):
    data = request.json

    if not data.get('amount') or not data.get('category') or not data.get('date'):
        return jsonify({'error': 'Campos obrigatórios: valor, categoria e data'}), 400

    try:
        amount = float(data['amount'])
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': 'Valor deve ser um número positivo'}), 400

    success = db.update_expense(
        expense_id=expense_id,
        amount=amount,
        category=data['category'],
        description=data.get('description', ''),
        date=data['date']
    )
    if success:
        return jsonify({'message': 'Gasto atualizado com sucesso'})
    return jsonify({'error': 'Gasto não encontrado'}), 404


@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense_route(expense_id):
    success = db.delete_expense(expense_id)
    if success:
        return jsonify({'message': 'Gasto excluído com sucesso'})
    return jsonify({'error': 'Gasto não encontrado'}), 404


# ── Resumo ──

@app.route('/api/summary')
def monthly_summary():
    year = request.args.get('year', date.today().year, type=int)
    month = request.args.get('month', date.today().month, type=int)

    summary = db.get_monthly_summary(year, month)
    daily = db.get_daily_totals(year, month)
    budgets_map = {b['category']: b['monthly_limit'] for b in db.get_budgets()}

    total = sum(item['total'] for item in summary)
    total_transactions = sum(item['count'] for item in summary)

    for item in summary:
        item['budget'] = budgets_map.get(item['category'])
        if item['budget']:
            item['percentage'] = round((item['total'] / item['budget']) * 100, 1)
        else:
            item['percentage'] = None

    return jsonify({
        'year': year,
        'month': month,
        'total': round(total, 2),
        'total_transactions': total_transactions,
        'categories': summary,
        'daily': daily
    })


# ── Orçamentos ──

@app.route('/api/budgets', methods=['GET'])
def list_budgets():
    budgets = db.get_budgets()
    return jsonify(budgets)


@app.route('/api/budgets', methods=['POST'])
def create_budget():
    data = request.json

    if not data.get('category') or not data.get('monthly_limit'):
        return jsonify({'error': 'Campos obrigatórios: categoria e limite mensal'}), 400

    try:
        monthly_limit = float(data['monthly_limit'])
        if monthly_limit <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({'error': 'Limite deve ser um número positivo'}), 400

    db.set_budget(data['category'], monthly_limit)
    return jsonify({'message': 'Orçamento definido com sucesso'}), 201


@app.route('/api/budgets/<int:budget_id>', methods=['DELETE'])
def delete_budget_route(budget_id):
    success = db.delete_budget(budget_id)
    if success:
        return jsonify({'message': 'Orçamento excluído com sucesso'})
    return jsonify({'error': 'Orçamento não encontrado'}), 404


# ── Exportação ──

@app.route('/api/export')
def export_csv():
    category = request.args.get('category')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    expenses = db.get_expenses(category, start_date, end_date)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Valor (R$)', 'Categoria', 'Descrição', 'Data'])
    for exp in expenses:
        writer.writerow([
            exp['id'], f"{exp['amount']:.2f}",
            exp['category'], exp['description'], exp['date']
        ])

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=gastos.csv'}
    )


# ──────────────────────────── MAIN ────────────────────────────────

if __name__ == '__main__':
    db.init_db()
    app.run(debug=True, port=5000)
