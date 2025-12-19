// js/reports.js - Sistema de relatórios PDF
class FinanceReports {
    constructor(financeData, userProfile) {
        this.financeData = financeData;
        this.userProfile = userProfile;
        this.pdf = null;
    }

    async generateMonthlyReport(month, year) {
        try {
            const { jsPDF } = window.jspdf;
            this.pdf = new jsPDF();
            
            // Configurações iniciais
            this.setupDocument();
            
            // Cabeçalho
            this.addHeader(month, year);
            
            // Resumo executivo
            this.addExecutiveSummary(month, year);
            
            // Receitas detalhadas
            this.addIncomeDetails(month, year);
            
            // Despesas detalhadas
            this.addExpenseDetails(month, year);
            
            // Análise por categoria
            this.addCategoryAnalysis(month, year);
            
            // Metas e objetivos
            this.addGoalsProgress();
            
            // Insights e recomendações
            this.addInsights();
            
            // Rodapé
            this.addFooter();
            
            return this.pdf;
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            throw error;
        }
    }

    setupDocument() {
        // Configurar fonte e cores
        this.pdf.setFont("helvetica");
        this.pdf.setFontSize(10);
    }

    addHeader(month, year) {
        const pageWidth = this.pdf.internal.pageSize.width;
        
        // Logo
        this.pdf.addImage({
            imageData: 'https://i.ibb.co/9mt6zRFj/generated-image-removebg-preview.png',
            x: 20,
            y: 15,
            width: 40,
            height: 40
        });

        // Título
        this.pdf.setFontSize(20);
        this.pdf.setTextColor(73, 172, 42);
        this.pdf.text("Relatório Financeiro Mensal", pageWidth / 2, 30, { align: "center" });
        
        this.pdf.setFontSize(14);
        this.pdf.setTextColor(100, 100, 100);
        const monthName = this.getMonthName(month);
        this.pdf.text(`${monthName} ${year}`, pageWidth / 2, 40, { align: "center" });

        // Informações do usuário
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(50, 50, 50);
        this.pdf.text(`Nome: ${this.userProfile.first_name} ${this.userProfile.last_name}`, 20, 60);
        this.pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, 60, { align: "right" });

        // Linha divisória
        this.pdf.setDrawColor(73, 172, 42);
        this.pdf.setLineWidth(0.5);
        this.pdf.line(20, 65, pageWidth - 20, 65);
    }

    addExecutiveSummary(month, year) {
        const data = this.calculateMonthlySummary(month, year);
        
        this.pdf.setFontSize(12);
        this.pdf.setTextColor(0, 0, 0);
        this.pdf.text("Resumo Executivo", 20, 80);
        
        this.pdf.setFontSize(10);
        
        // Valores
        const yStart = 90;
        const col1 = 30;
        const col2 = 100;
        
        this.pdf.text("Receitas Totais:", col1, yStart);
        this.pdf.text(`R$ ${data.totalIncome.toFixed(2)}`, col2, yStart);
        
        this.pdf.text("Despesas Totais:", col1, yStart + 8);
        this.pdf.text(`R$ ${data.totalExpense.toFixed(2)}`, col2, yStart + 8);
        
        this.pdf.text("Saldo do Mês:", col1, yStart + 16);
        this.pdf.text(`R$ ${data.balance.toFixed(2)}`, col2, yStart + 16);
        
        this.pdf.text("Economia Realizada:", col1, yStart + 24);
        this.pdf.text(`${data.savingsRate}% do orçamento`, col2, yStart + 24);
        
        // Gráfico de pizza simples
        this.addPieChart(data.totalIncome, data.totalExpense, 130, yStart - 10);
    }

    addIncomeDetails(month, year) {
        const incomes = this.getMonthlyTransactions(month, year, 'income');
        
        this.pdf.addPage();
        this.pdf.setFontSize(12);
        this.pdf.text("Detalhamento de Receitas", 20, 20);
        
        if (incomes.length === 0) {
            this.pdf.setFontSize(10);
            this.pdf.text("Nenhuma receita registrada neste período.", 20, 30);
            return;
        }

        // Tabela de receitas
        const headers = [["Data", "Descrição", "Categoria", "Valor"]];
        const rows = incomes.map(income => [
            new Date(income.date).toLocaleDateString('pt-BR'),
            income.description,
            this.getCategoryName(income.category),
            `R$ ${income.amount.toFixed(2)}`
        ]);

        this.pdf.autoTable({
            startY: 30,
            head: headers,
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [73, 172, 42] },
            columnStyles: {
                3: { halign: 'right' }
            }
        });
    }

    addExpenseDetails(month, year) {
        const expenses = this.getMonthlyTransactions(month, year, 'expense');
        
        this.pdf.setFontSize(12);
        this.pdf.text("Detalhamento de Despesas", 20, this.pdf.lastAutoTable.finalY + 20);
        
        if (expenses.length === 0) {
            this.pdf.setFontSize(10);
            this.pdf.text("Nenhuma despesa registrada neste período.", 20, this.pdf.lastAutoTable.finalY + 30);
            return;
        }

        // Tabela de despesas
        const headers = [["Data", "Descrição", "Categoria", "Valor"]];
        const rows = expenses.map(expense => [
            new Date(expense.date).toLocaleDateString('pt-BR'),
            expense.description,
            this.getCategoryName(expense.category),
            `R$ ${expense.amount.toFixed(2)}`
        ]);

        this.pdf.autoTable({
            startY: this.pdf.lastAutoTable.finalY + 30,
            head: headers,
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [244, 67, 54] },
            columnStyles: {
                3: { halign: 'right' }
            }
        });
    }

    addCategoryAnalysis(month, year) {
        const categoryData = this.calculateCategoryAnalysis(month, year);
        
        this.pdf.addPage();
        this.pdf.setFontSize(12);
        this.pdf.text("Análise por Categoria", 20, 20);
        
        // Gráfico de barras por categoria
        this.addCategoryBarChart(categoryData, 20, 30);
        
        // Tabela de categorias
        const headers = [["Categoria", "Valor", "% do Total"]];
        const rows = categoryData.map(item => [
            item.name,
            `R$ ${item.value.toFixed(2)}`,
            `${item.percentage}%`
        ]);

        this.pdf.autoTable({
            startY: 120,
            head: headers,
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' }
            }
        });
    }

    addGoalsProgress() {
        const goals = this.financeData.goals || [];
        const activeGoals = goals.filter(g => g.status === 'active');
        
        if (activeGoals.length === 0) return;
        
        this.pdf.addPage();
        this.pdf.setFontSize(12);
        this.pdf.text("Acompanhamento de Metas", 20, 20);
        
        // Tabela de metas
        const headers = [["Meta", "Valor Alvo", "Valor Atual", "Progresso", "Previsão"]];
        const rows = activeGoals.map(goal => [
            goal.name,
            `R$ ${goal.target.toFixed(2)}`,
            `R$ ${goal.current.toFixed(2)}`,
            `${goal.progress}%`,
            this.getGoalEstimate(goal)
        ]);

        this.pdf.autoTable({
            startY: 30,
            head: headers,
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [255, 193, 7] }
        });
    }

    addInsights() {
        const insights = this.generateFinancialInsights();
        
        this.pdf.addPage();
        this.pdf.setFontSize(12);
        this.pdf.text("Insights e Recomendações", 20, 20);
        
        this.pdf.setFontSize(10);
        let yPosition = 30;
        
        insights.forEach((insight, index) => {
            if (yPosition > 270) {
                this.pdf.addPage();
                yPosition = 20;
            }
            
            this.pdf.setFontSize(10);
            this.pdf.setTextColor(50, 50, 50);
            this.pdf.text(`${index + 1}. ${insight.title}`, 20, yPosition);
            
            this.pdf.setFontSize(9);
            this.pdf.setTextColor(100, 100, 100);
            this.pdf.text(insight.description, 25, yPosition + 5, { maxWidth: 170 });
            
            yPosition += 20;
        });
    }

    addFooter() {
        const pageCount = this.pdf.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            this.pdf.setPage(i);
            
            // Número da página
            this.pdf.setFontSize(8);
            this.pdf.setTextColor(150, 150, 150);
            this.pdf.text(
                `Página ${i} de ${pageCount}`,
                this.pdf.internal.pageSize.width / 2,
                this.pdf.internal.pageSize.height - 10,
                { align: "center" }
            );
            
            // Informações de confidencialidade
            this.pdf.text(
                "Confidencial - Uso exclusivo do destinatário",
                20,
                this.pdf.internal.pageSize.height - 10
            );
        }
    }

    addPieChart(income, expense, x, y) {
        const total = income + expense;
        const incomeAngle = (income / total) * 360;
        
        // Desenhar gráfico de pizza
        this.pdf.setFillColor(76, 175, 80); // Verde para receitas
        this.pdf.circle(x, y, 20, 'F');
        
        this.pdf.setFillColor(244, 67, 54); // Vermelho para despesas
        this.pdf.ellipse(x, y, 20, 20, 0, 0, incomeAngle * Math.PI / 180, 'F');
        
        // Legenda
        this.pdf.setFillColor(76, 175, 80);
        this.pdf.rect(x + 25, y - 15, 5, 5, 'F');
        this.pdf.setTextColor(0, 0, 0);
        this.pdf.text("Receitas", x + 35, y - 11);
        
        this.pdf.setFillColor(244, 67, 54);
        this.pdf.rect(x + 25, y - 5, 5, 5, 'F');
        this.pdf.text("Despesas", x + 35, y - 1);
    }

    addCategoryBarChart(categoryData, x, y) {
        const maxValue = Math.max(...categoryData.map(d => d.value));
        const barWidth = 150;
        const barHeight = 10;
        const spacing = 15;
        
        categoryData.slice(0, 5).forEach((item, index) => {
            const barLength = (item.value / maxValue) * barWidth;
            
            // Barra
            this.pdf.setFillColor(73, 172, 42);
            this.pdf.rect(x, y + (index * spacing), barLength, barHeight, 'F');
            
            // Rótulo
            this.pdf.setTextColor(0, 0, 0);
            this.pdf.text(item.name, x, y + (index * spacing) - 3);
            
            // Valor
            this.pdf.text(`R$ ${item.value.toFixed(2)}`, x + barWidth + 10, y + (index * spacing) + barHeight/2);
        });
    }

    calculateMonthlySummary(month, year) {
        const transactions = this.getMonthlyTransactions(month, year);
        
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;
        
        return {
            totalIncome,
            totalExpense,
            balance,
            savingsRate
        };
    }

    getMonthlyTransactions(month, year, type = null) {
        return this.financeData.transactions.filter(t => {
            const date = new Date(t.date);
            const matchesMonth = date.getMonth() + 1 === month;
            const matchesYear = date.getFullYear() === year;
            const matchesType = !type || t.type === type;
            
            return matchesMonth && matchesYear && matchesType;
        });
    }

    calculateCategoryAnalysis(month, year) {
        const expenses = this.getMonthlyTransactions(month, year, 'expense');
        const categoryMap = new Map();
        
        expenses.forEach(expense => {
            const current = categoryMap.get(expense.category) || 0;
            categoryMap.set(expense.category, current + expense.amount);
        });
        
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        return [...categoryMap.entries()]
            .map(([category, value]) => ({
                name: this.getCategoryName(category),
                value,
                percentage: ((value / totalExpenses) * 100).toFixed(1)
            }))
            .sort((a, b) => b.value - a.value);
    }

    generateFinancialInsights() {
        const insights = [];
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        // Análise do mês atual
        const currentMonthData = this.calculateMonthlySummary(currentMonth, currentYear);
        const lastMonthData = this.calculateMonthlySummary(
            currentMonth === 1 ? 12 : currentMonth - 1,
            currentMonth === 1 ? currentYear - 1 : currentYear
        );
        
        // Insight 1: Comparação com mês anterior
        if (currentMonthData.totalExpense > lastMonthData.totalExpense * 1.2) {
            insights.push({
                title: "Atenção: Despesas em alta",
                description: `Suas despesas aumentaram ${((currentMonthData.totalExpense / lastMonthData.totalExpense - 1) * 100).toFixed(0)}% em relação ao mês anterior. Considere revisar seus gastos.`
            });
        }
        
        // Insight 2: Taxa de economia
        if (currentMonthData.savingsRate < 10) {
            insights.push({
                title: "Oportunidade de economia",
                description: `Sua taxa de economia está em ${currentMonthData.savingsRate}%. Recomendamos estabelecer uma meta de pelo menos 15% para construir reservas.`
            });
        }
        
        // Insight 3: Categorias com maior gasto
        const categoryAnalysis = this.calculateCategoryAnalysis(currentMonth, currentYear);
        if (categoryAnalysis.length > 0) {
            const topCategory = categoryAnalysis[0];
            if (topCategory.percentage > 30) {
                insights.push({
                    title: "Concentração de gastos",
                    description: `${topCategory.name} representa ${topCategory.percentage}% dos seus gastos. Avalie se há oportunidades de redução nesta categoria.`
                });
            }
        }
        
        // Insight 4: Metas
        const goals = this.financeData.goals || [];
        const upcomingGoals = goals.filter(g => 
            g.status === 'active' && 
            g.deadline && 
            new Date(g.deadline) > now &&
            new Date(g.deadline) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        );
        
        if (upcomingGoals.length > 0) {
            insights.push({
                title: "Metas próximas do prazo",
                description: `Você tem ${upcomingGoals.length} meta(s) com prazo nos próximos 30 dias. Verifique seu progresso.`
            });
        }
        
        return insights;
    }

    getMonthName(month) {
        const months = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        return months[month - 1] || "";
    }

    getCategoryName(categoryId) {
        const category = financeApp.categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
    }

    getGoalEstimate(goal) {
        if (!goal.deadline) return "Sem previsão";
        
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const monthsRemaining = this.getMonthDiff(now, deadline);
        
        if (monthsRemaining <= 0) return "Vencido";
        
        const monthlyNeeded = (goal.target - goal.current) / monthsRemaining;
        return `R$ ${monthlyNeeded.toFixed(2)}/mês`;
    }

    getMonthDiff(date1, date2) {
        return (date2.getFullYear() - date1.getFullYear()) * 12 + 
               (date2.getMonth() - date1.getMonth());
    }

    downloadReport(filename = "relatorio-financeiro.pdf") {
        if (this.pdf) {
            this.pdf.save(filename);
        }
    }
}

// Exportar para uso global
window.FinanceReports = FinanceReports;