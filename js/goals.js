// js/goals.js - Sistema de metas financeiras
class FinanceGoals {
    constructor(financeData) {
        this.financeData = financeData;
        this.goals = financeData.goals || [];
    }

    createGoal(goalData) {
        const goal = {
            id: Date.now().toString(),
            name: goalData.name,
            type: goalData.type || 'savings',
            target: parseFloat(goalData.target),
            current: parseFloat(goalData.current) || 0,
            deadline: goalData.deadline,
            category: goalData.category,
            priority: goalData.priority || 'medium',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            notes: goalData.notes || ''
        };

        this.goals.push(goal);
        this.saveGoals();
        return goal;
    }

    updateGoal(goalId, updates) {
        const goalIndex = this.goals.findIndex(g => g.id === goalId);
        
        if (goalIndex === -1) return null;

        this.goals[goalIndex] = {
            ...this.goals[goalIndex],
            ...updates,
            updated_at: new Date().toISOString()
        };

        // Atualizar status baseado no progresso
        const goal = this.goals[goalIndex];
        if (goal.current >= goal.target) {
            goal.status = 'completed';
        } else if (goal.deadline && new Date(goal.deadline) < new Date()) {
            goal.status = 'failed';
        }

        this.saveGoals();
        return this.goals[goalIndex];
    }

    deleteGoal(goalId) {
        this.goals = this.goals.filter(g => g.id !== goalId);
        this.saveGoals();
    }

    addContribution(goalId, amount) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return null;

        goal.current += parseFloat(amount);
        goal.updated_at = new Date().toISOString();

        // Verificar se a meta foi alcançada
        if (goal.current >= goal.target) {
            goal.status = 'completed';
            this.triggerGoalCompleted(goal);
        }

        this.saveGoals();
        return goal;
    }

    calculateGoalProgress(goal) {
        if (!goal.target || goal.target === 0) return 0;
        return Math.min((goal.current / goal.target) * 100, 100);
    }

    calculateDaysRemaining(goal) {
        if (!goal.deadline) return null;
        
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const diffTime = deadline - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    calculateMonthlyNeeded(goal) {
        if (!goal.deadline) return null;
        
        const daysRemaining = this.calculateDaysRemaining(goal);
        if (daysRemaining <= 0) return 0;

        const amountNeeded = goal.target - goal.current;
        const monthsRemaining = daysRemaining / 30.44;
        
        return amountNeeded / monthsRemaining;
    }

    getGoalsByStatus(status = 'active') {
        return this.goals.filter(g => g.status === status);
    }

    getGoalsByType(type) {
        return this.goals.filter(g => g.type === type);
    }

    getGoalsByPriority(priority) {
        return this.goals.filter(g => g.priority === priority);
    }

    getUpcomingGoals(days = 30) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        return this.goals.filter(g => {
            if (g.status !== 'active' || !g.deadline) return false;
            
            const deadline = new Date(g.deadline);
            return deadline > now && deadline <= futureDate;
        });
    }

    getOverdueGoals() {
        const now = new Date();
        
        return this.goals.filter(g => {
            if (g.status !== 'active' || !g.deadline) return false;
            
            const deadline = new Date(g.deadline);
            return deadline < now;
        });
    }

    calculateTotalGoalsValue() {
        return this.goals.reduce((total, goal) => total + goal.target, 0);
    }

    calculateCompletedGoalsValue() {
        return this.goals
            .filter(g => g.status === 'completed')
            .reduce((total, goal) => total + goal.target, 0);
    }

    calculateOverallProgress() {
        const totalTarget = this.calculateTotalGoalsValue();
        const totalCurrent = this.goals.reduce((total, goal) => total + goal.current, 0);
        
        if (totalTarget === 0) return 0;
        return (totalCurrent / totalTarget) * 100;
    }

    generateGoalRecommendations() {
        const recommendations = [];
        const activeGoals = this.getGoalsByStatus('active');
        
        // Verificar metas sem prazo
        const goalsWithoutDeadline = activeGoals.filter(g => !g.deadline);
        if (goalsWithoutDeadline.length > 0) {
            recommendations.push({
                type: 'warning',
                message: `${goalsWithoutDeadline.length} meta(s) sem prazo definido. Estabelecer prazos ajuda a manter o foco.`
            });
        }

        // Verificar metas em atraso
        const overdueGoals = this.getOverdueGoals();
        if (overdueGoals.length > 0) {
            recommendations.push({
                type: 'danger',
                message: `${overdueGoals.length} meta(s) em atraso. Considere ajustar os prazos ou aumentar as contribuições.`
            });
        }

        // Verificar metas próximas do prazo
        const upcomingGoals = this.getUpcomingGoals(30);
        if (upcomingGoals.length > 0) {
            recommendations.push({
                type: 'info',
                message: `${upcomingGoals.length} meta(s) com prazo nos próximos 30 dias. Verifique seu progresso.`
            });
        }

        // Verificar metas com baixo progresso
        const lowProgressGoals = activeGoals.filter(g => {
            const progress = this.calculateGoalProgress(g);
            const daysRemaining = this.calculateDaysRemaining(g);
            return progress < 50 && daysRemaining && daysRemaining < 60;
        });

        if (lowProgressGoals.length > 0) {
            recommendations.push({
                type: 'warning',
                message: `${lowProgressGoals.length} meta(s) com progresso abaixo de 50% e menos de 60 dias restantes.`
            });
        }

        return recommendations;
    }

    triggerGoalCompleted(goal) {
        // Criar notificação de meta concluída
        const event = new CustomEvent('goalCompleted', {
            detail: { goal }
        });
        document.dispatchEvent(event);

        // Adicionar ao histórico de conquistas
        this.addToAchievements(goal);
    }

    addToAchievements(goal) {
        const achievement = {
            goal_id: goal.id,
            goal_name: goal.name,
            target: goal.target,
            completed_at: new Date().toISOString(),
            completion_time: this.calculateCompletionTime(goal)
        };

        // Salvar no histórico local
        if (!this.financeData.achievements) {
            this.financeData.achievements = [];
        }
        this.financeData.achievements.push(achievement);
    }

    calculateCompletionTime(goal) {
        const created = new Date(goal.created_at);
        const completed = new Date();
        const diffTime = completed - created;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Dias
    }

    saveGoals() {
        this.financeData.goals = this.goals;
        // Disparar evento para salvar no Supabase
        const event = new CustomEvent('saveFinanceData');
        document.dispatchEvent(event);
    }

    // Métodos para UI
    renderGoalCard(goal) {
        const progress = this.calculateGoalProgress(goal);
        const daysRemaining = this.calculateDaysRemaining(goal);
        const monthlyNeeded = this.calculateMonthlyNeeded(goal);

        return `
            <div class="goal-card" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <h4>${goal.name}</h4>
                    <span class="goal-priority ${goal.priority}">${this.getPriorityLabel(goal.priority)}</span>
                </div>
                
                <div class="goal-progress">
                    <div class="progress-info">
                        <span class="current">R$ ${goal.current.toFixed(2)}</span>
                        <span class="target">de R$ ${goal.target.toFixed(2)}</span>
                        <span class="percentage">${progress.toFixed(1)}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                
                <div class="goal-details">
                    ${goal.deadline ? `
                        <div class="detail-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Prazo: ${new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
                            ${daysRemaining ? `<small>(${daysRemaining} dias restantes)</small>` : ''}
                        </div>
                    ` : ''}
                    
                    ${monthlyNeeded ? `
                        <div class="detail-item">
                            <i class="fas fa-chart-line"></i>
                            <span>Necessário: R$ ${monthlyNeeded.toFixed(2)}/mês</span>
                        </div>
                    ` : ''}
                    
                    ${goal.category ? `
                        <div class="detail-item">
                            <i class="fas fa-tag"></i>
                            <span>Categoria: ${this.getCategoryName(goal.category)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="goal-actions">
                    <button class="btn btn-sm btn-success" onclick="addContribution('${goal.id}')">
                        <i class="fas fa-plus"></i> Adicionar
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editGoal('${goal.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGoal('${goal.id}')">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
    }

    getPriorityLabel(priority) {
        const labels = {
            'high': 'Alta',
            'medium': 'Média',
            'low': 'Baixa'
        };
        return labels[priority] || priority;
    }

    getCategoryName(categoryId) {
        const category = financeApp.categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
    }
}

// Exportar para uso global
window.FinanceGoals = FinanceGoals;