// js/charts.js - Sistema de gráficos
class FinanceCharts {
    constructor(financeData) {
        this.financeData = financeData;
        this.charts = {};
    }

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        // Calcular dados por categoria
        const categoryData = this.calculateCategoryData();
        
        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categoryData.labels,
                datasets: [{
                    data: categoryData.values,
                    backgroundColor: categoryData.colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    calculateCategoryData(period = 'month') {
        const transactions = this.filterTransactionsByPeriod(period);
        const expenses = transactions.filter(t => t.type === 'expense');
        
        const categoryMap = new Map();
        
        expenses.forEach(transaction => {
            const current = categoryMap.get(transaction.category) || 0;
            categoryMap.set(transaction.category, current + transaction.amount);
        });

        // Ordenar por valor (do maior para o menor)
        const sortedCategories = [...categoryMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8); // Mostrar apenas top 8

        return {
            labels: sortedCategories.map(([category]) => this.getCategoryName(category)),
            values: sortedCategories.map(([, value]) => value),
            colors: sortedCategories.map(([category]) => this.getCategoryColor(category))
        };
    }

    createIncomeExpenseChart() {
        const ctx = document.getElementById('incomeExpenseChart');
        if (!ctx) return;

        const data = this.calculateMonthlyIncomeExpense();

        this.charts.incomeExpense = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Receitas',
                        data: data.income,
                        backgroundColor: 'rgba(76, 175, 80, 0.7)',
                        borderColor: 'rgb(76, 175, 80)',
                        borderWidth: 1
                    },
                    {
                        label: 'Despesas',
                        data: data.expenses,
                        backgroundColor: 'rgba(244, 67, 54, 0.7)',
                        borderColor: 'rgb(244, 67, 54)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                return `${label}: R$ ${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    createWealthChart() {
        const ctx = document.getElementById('wealthChart');
        if (!ctx) return;

        const data = this.calculateWealthEvolution();

        this.charts.wealth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Patrimônio',
                    data: data.values,
                    borderColor: 'rgb(73, 172, 42)',
                    backgroundColor: 'rgba(73, 172, 42, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw || 0;
                                return `Patrimônio: R$ ${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateCategoryChart(period = 'month') {
        if (this.charts.category) {
            const data = this.calculateCategoryData(period);
            this.charts.category.data.labels = data.labels;
            this.charts.category.data.datasets[0].data = data.values;
            this.charts.category.data.datasets[0].backgroundColor = data.colors;
            this.charts.category.update();
        }
    }

    updateIncomeExpenseChart(months = 6) {
        if (this.charts.incomeExpense) {
            const data = this.calculateMonthlyIncomeExpense(months);
            this.charts.incomeExpense.data.labels = data.labels;
            this.charts.incomeExpense.data.datasets[0].data = data.income;
            this.charts.incomeExpense.data.datasets[1].data = data.expenses;
            this.charts.incomeExpense.update();
        }
    }

    updateWealthChart(months = 12) {
        if (this.charts.wealth) {
            const data = this.calculateWealthEvolution(months);
            this.charts.wealth.data.labels = data.labels;
            this.charts.wealth.data.datasets[0].data = data.values;
            this.charts.wealth.update();
        }
    }

    filterTransactionsByPeriod(period) {
        const now = new Date();
        let startDate;

        switch(period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'all':
            default:
                startDate = new Date(0); // Data mínima
        }

        return this.financeData.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate;
        });
    }

    calculateMonthlyIncomeExpense(months = 6) {
        const result = {
            labels: [],
            income: [],
            expenses: []
        };

        const now = new Date();
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            
            result.labels.push(monthLabel);
            result.income.push(0);
            result.expenses.push(0);
        }

        // Preencher com dados
        this.financeData.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            const monthDiff = this.getMonthDiff(transactionDate, now);
            
            if (monthDiff >= 0 && monthDiff < months) {
                const index = months - monthDiff - 1;
                if (transaction.type === 'income') {
                    result.income[index] += transaction.amount;
                } else if (transaction.type === 'expense') {
                    result.expenses[index] += transaction.amount;
                }
            }
        });

        return result;
    }

    calculateWealthEvolution(months = 12) {
        const result = {
            labels: [],
            values: []
        };

        const now = new Date();
        let currentBalance = 0;

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' });
            
            // Calcular saldo até esta data
            const monthlyTransactions = this.financeData.transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate <= date;
            });

            const monthlyBalance = monthlyTransactions.reduce((total, t) => {
                if (t.type === 'income') return total + t.amount;
                if (t.type === 'expense') return total - t.amount;
                return total;
            }, 0);

            currentBalance = monthlyBalance;
            result.labels.push(monthLabel);
            result.values.push(currentBalance);
        }

        return result;
    }

    getCategoryName(categoryId) {
        const category = this.financeApp.categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
    }

    getCategoryColor(categoryId) {
        const category = this.financeApp.categories.find(c => c.id === categoryId);
        return category ? category.color : '#CCCCCC';
    }

    getMonthDiff(date1, date2) {
        return (date2.getFullYear() - date1.getFullYear()) * 12 + 
               (date2.getMonth() - date1.getMonth());
    }

    destroyAll() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Exportar para uso global
window.FinanceCharts = FinanceCharts;