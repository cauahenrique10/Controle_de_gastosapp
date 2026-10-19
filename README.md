# 💰 Finanças — Controle de Gastos Pessoais

<p align="center">
  Uma aplicação web completa para gerenciamento de finanças pessoais, com dashboard interativo, gráficos dinâmicos e controle de orçamento por categoria.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

---

## 📋 Sobre o Projeto

O **Finanças** é uma aplicação web desenvolvida para facilitar o controle de gastos pessoais no dia a dia. A ideia surgiu da necessidade de ter uma ferramenta simples, visual e acessível para acompanhar para onde o dinheiro está indo — sem depender de planilhas complexas ou aplicativos cheios de propaganda.

A aplicação possui uma interface moderna com tema escuro, gráficos interativos e uma experiência fluida tanto no desktop quanto no celular.

---

## ✨ Funcionalidades

- **📊 Dashboard interativo** — Visão geral do mês com cards de resumo, gráfico de rosca por categoria e gráfico de barras com gastos diários
- **➕ Gerenciamento de gastos** — Adicionar, editar e excluir gastos com categoria, descrição, valor e data
- **🔍 Filtros avançados** — Filtrar gastos por categoria e período (data inicial e final)
- **💰 Controle de orçamento** — Definir limites mensais por categoria com barras de progresso visuais
- **⚠️ Alertas inteligentes** — Notificações automáticas quando um gasto atinge 80% ou ultrapassa 100% do orçamento
- **📁 Exportação CSV** — Exportar todos os dados filtrados para uma planilha
- **📱 Design responsivo** — Interface adaptável para desktop, tablet e celular
- **🌙 Tema escuro** — Design premium com glassmorphism, gradientes e micro-animações

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| **Backend** | Python + Flask | Servidor web e API RESTful |
| **Banco de Dados** | SQLite | Armazenamento local dos dados |
| **Frontend** | HTML5 + CSS3 + JavaScript | Interface do usuário |
| **Gráficos** | Chart.js | Visualização de dados interativa |
| **Ícones** | Font Awesome | Iconografia da interface |
| **Tipografia** | Google Fonts (Inter) | Tipografia moderna |

---

## 📁 Estrutura do Projeto

```
projeto_controle_de_gastos/
├── app.py                  # Aplicação Flask (rotas e API)
├── database.py             # Camada de banco de dados (CRUD)
├── requirements.txt        # Dependências do projeto
├── templates/
│   └── index.html          # Página principal (SPA)
├── static/
│   ├── css/
│   │   └── style.css       # Design system completo
│   └── js/
│       └── app.js          # Lógica do frontend
└── data/
    └── gastos.db           # Banco de dados SQLite (criado automaticamente)
```

---

## 🚀 Como Executar

### Pré-requisitos

- Python 3.10 ou superior instalado

### Instalação

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/projeto_controle_de_gastos.git
cd projeto_controle_de_gastos

# Instale as dependências
pip install -r requirements.txt

# Execute a aplicação
python app.py
```

Acesse **http://127.0.0.1:5000** no navegador.

---

## 🔌 API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/categories` | Lista todas as categorias |
| `GET` | `/api/expenses` | Lista gastos (com filtros opcionais) |
| `POST` | `/api/expenses` | Adiciona um novo gasto |
| `PUT` | `/api/expenses/:id` | Atualiza um gasto existente |
| `DELETE` | `/api/expenses/:id` | Remove um gasto |
| `GET` | `/api/summary` | Resumo mensal por categoria |
| `GET` | `/api/budgets` | Lista orçamentos definidos |
| `POST` | `/api/budgets` | Define ou atualiza um orçamento |
| `DELETE` | `/api/budgets/:id` | Remove um orçamento |
| `GET` | `/api/export` | Exporta gastos em CSV |

---

## 🎨 Categorias Disponíveis

| Emoji | Categoria |
|-------|-----------|
| 🍔 | Alimentação |
| 🚗 | Transporte |
| 🏠 | Moradia |
| 🎮 | Lazer |
| 📚 | Educação |
| 🏥 | Saúde |
| 🛒 | Compras |
| 📦 | Outros |

---

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.

---

<p align="center">
  Desenvolvido com ☕ e dedicação
</p>
