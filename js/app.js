// app.js - Controlador principal da aplicação FinanceApp
// Integração completa com Supabase

class FinanceApp {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.financeData = {
            accounts: [],
            cards: [],
            transactions: [],
            categories: [],
            goals: [],
            settings: {}
        };
        this.charts = null;
        this.goals = null;
        this.reports = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // 1. Inicializar Supabase (evitando declaração duplicada)
            await this.initializeSupabase();
            
            // 2. Verificar autenticação do usuário
            await this.checkAuth();
            
            // 3. Esconder loading screen após 1s (mesmo sem dados)
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 1000);
            
            // 4. Configurar event listeners
            this.setupEventListeners();
            
            // 5. Mostrar dashboard
            this.showPage('dashboard');
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showNotification('Erro ao inicializar aplicação', 'error');
        }
    }

    async initializeSupabase() {
        // Verificar se já existe uma instância global
        if (window.supabaseClient) {
            this.supabase = window.supabaseClient;
            console.log('Usando instância existente do Supabase');
            return;
        }

        // Configuração do Supabase
        const SUPABASE_URL = 'https://lebfczoywiqkczppwuwg.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlYmZjem95d2lxa2N6cHB3dXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzU2NDEsImV4cCI6MjA4MTU1MTY0MX0.wcbahZkGNp7AT6aTqwuVM3belEhVuqWVRb3MssoUKms';

        // Criar cliente Supabase
        this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // Salvar globalmente para reutilização
        window.supabaseClient = this.supabase;
        
        console.log('Supabase inicializado com sucesso');
    }

    async checkAuth() {
        const { data: { user }, error } = await this.supabase.auth.getUser();
        
        if (error) {
            console.error('Erro ao verificar autenticação:', error);
            return;
        }
        
        if (user) {
            this.user = user;
            this.updateUIForLoggedInUser();
            await this.loadUserData();
        } else {
            this.updateUIForLoggedOutUser();
        }
    }

    updateUIForLoggedInUser() {
        document.getElementById('loggedOutState').style.display = 'none';
        document.getElementById('loggedInState').style.display = 'flex';
        
        // Atualizar informações do usuário
        if (this.user.user_metadata) {
            const name = this.user.user_metadata.full_name || this.user.email.split('@')[0];
            document.getElementById('userName').textContent = name;
            document.getElementById('dropdownName').textContent = name;
            
            // Atualizar avatar
            const avatarUrl = this.user.user_metadata.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=49ac2a&color=fff`;
            
            document.getElementById('userAvatar').src = avatarUrl;
            document.getElementById('dropdownAvatar').src = avatarUrl;
        }
        
        document.getElementById('dropdownEmail').textContent = this.user.email;
    }

    updateUIForLoggedOutUser() {
        document.getElementById('loggedOutState').style.display = 'block';
        document.getElementById('loggedInState').style.display = 'none';
    }

    async loadUserData() {
        if (!this.user) return;
        
        try {
            // Carregar dados de exemplo inicialmente
            await this.loadSampleData();
            
            // Inicializar módulos
            this.initializeModules();
            
            // Atualizar dashboard
            this.updateDashboard();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showNotification('Usando dados de demonstração', 'info');
            
            // Carregar dados de demonstração em caso de erro
            await this.loadDemoData();
        }
    }

    async loadSampleData() {
        // Criar categorias padrão
        this.financeData.categories = [
            { id: '1', name: 'Alimentação', color: '#FF6B6B', icon: 'fas fa-utensils', type: 'expense' },
            { id: '2', name: 'Transporte', color: '#4ECDC4', icon: 'fas fa-car', type: 'expense' },
            { id: '3', name: 'Moradia', color: '#45B7D1', icon: 'fas fa-home', type: 'expense' },
            { id: '4', name: 'Educação', color: '#96CEB4', icon: 'fas fa-graduation-cap', type: 'expense' },
            { id: '5', name: 'Lazer', color: '#FFEAA7', icon: 'fas fa-gamepad', type: 'expense' },
            { id: '6', name: 'Salário', color: '#98D8C8', icon: 'fas fa-money-bill-wave', type: 'income' },
            { id: '7', name: 'Freelance', color: '#F7DC6F', icon: 'fas fa-laptop-code', type: 'income' }
        ];

        // Carregar transações de exemplo
        await this.loadSampleTransactions();
        
        // Carregar contas de exemplo
        this.financeData.accounts = [
            { id: '1', name: 'Conta Corrente', bank: 'Banco Exemplo', balance: 4500.00, type: 'checking' },
            { id: '2', name: 'Conta Poupança', bank: 'Banco Exemplo', balance: 12000.00, type: 'savings' }
        ];

        // Carregar cartões de exemplo
        this.financeData.cards = [
            { id: '1', bank: 'Banco Exemplo', brand: 'visa', last4: '1234', limit: 5000.00, used: 1250.00, due_day: 10 },
            { id: '2', bank: 'Outro Banco', brand: 'mastercard', last4: '5678', limit: 3000.00, used: 500.00, due_day: 15 }
        ];

        // Carregar metas de exemplo
        this.financeData.goals = [
            { 
                id: '1', 
                name: 'Viagem para Europa', 
                target: 10000.00, 
                current: 3500.00, 
                deadline: '2024-12-31',
                priority: 'high',
                status: 'active'
            },
            { 
                id: '2', 
                name: 'Notebook novo', 
                target: 5000.00, 
                current: 2000.00, 
                deadline: '2024-06-30',
                priority: 'medium',
                status: 'active'
            }
        ];

        // Configurações padrão
        this.financeData.settings = {
            theme: 'light',
            currency: 'BRL',
            language: 'pt-BR'
        };
    }

    async loadSampleTransactions() {
        // Gerar transações de exemplo para os últimos 6 meses
        const categories = this.financeData.categories;
        const now = new Date();
        
        this.financeData.transactions = [];
        
        for (let i = 0; i < 50; i++) {
            const monthOffset = Math.floor(Math.random() * 6);
            const day = Math.floor(Math.random() * 28) + 1;
            const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, day);
            
            const isIncome = Math.random() > 0.7;
            const category = categories.find(c => c.type === (isIncome ? 'income' : 'expense'));
            
            this.financeData.transactions.push({
                id: `t${i}`,
                date: date.toISOString().split('T')[0],
                description: isIncome ? 
                    ['Salário', 'Freelance', 'Dividendos', 'Rendimentos'][Math.floor(Math.random() * 4)] :
                    ['Supermercado', 'Combustível', 'Aluguel', 'Internet', 'Cinema'][Math.floor(Math.random() * 5)],
                type: isIncome ? 'income' : 'expense',
                category: category ? category.id : '1',
                amount: isIncome ? 
                    (Math.random() * 5000 + 2000).toFixed(2) :
                    (Math.random() * 500 + 50).toFixed(2),
                status: 'completed'
            });
        }
        
        // Ordenar por data (mais recente primeiro)
        this.financeData.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async loadDemoData() {
        // Dados de demonstração para usuários não logados
        await this.loadSampleData();
        this.initializeModules();
        this.updateDashboard();
    }

    initializeModules() {
        // Inicializar módulo de gráficos
        if (typeof FinanceCharts !== 'undefined') {
            this.charts = new FinanceCharts(this.financeData);
            this.charts.financeApp = this; // Adicionar referência
        }
        
        // Inicializar módulo de metas
        if (typeof FinanceGoals !== 'undefined') {
            this.goals = new FinanceGoals(this.financeData);
        }
        
        // Inicializar módulo de relatórios
        if (typeof FinanceReports !== 'undefined') {
            this.reports = new FinanceReports(this.financeData, {
                first_name: this.user ? this.user.email.split('@')[0] : 'Demo',
                last_name: '',
                email: this.user ? this.user.email : 'demo@example.com'
            });
        }
    }

    setupEventListeners() {
        // Listener para mudanças de autenticação
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Evento de autenticação:', event);
            
            if (event === 'SIGNED_IN' && session) {
                this.user = session.user;
                this.updateUIForLoggedInUser();
                this.loadUserData();
            } else if (event === 'SIGNED_OUT') {
                this.user = null;
                this.updateUIForLoggedOutUser();
                this.loadDemoData(); // Manter dados demo
            }
        });

        // Listener para tecla Escape (fechar modais)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    // Métodos de UI
    showPage(pageId) {
        // Esconder todas as páginas
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Remover classe active de todos os links de navegação
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Mostrar página solicitada
        const pageElement = document.getElementById(`${pageId}Page`);
        if (pageElement) {
            pageElement.classList.add('active');
            
            // Atualizar link de navegação ativo
            const navLink = document.querySelector(`[onclick="showPage('${pageId}')"]`);
            if (navLink) {
                navLink.classList.add('active');
            }
        }
        
        // Atualizar gráficos se for dashboard
        if (pageId === 'dashboard' && this.charts) {
            setTimeout(() => {
                this.updateDashboardCharts();
            }, 100);
        }
    }

    updateDashboardCharts() {
        if (this.charts) {
            this.charts.createCategoryChart();
            this.charts.createIncomeExpenseChart();
            this.charts.createWealthChart();
        }
    }

    updateDashboard() {
        if (!this.financeData.transactions) return;
        
        // Calcular totais
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyTransactions = this.financeData.transactions.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        const totalIncome = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const totalExpense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const totalBalance = totalIncome - totalExpense;
        
        // Atualizar totais
        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpense').textContent = this.formatCurrency(totalExpense);
        document.getElementById('totalBalance').textContent = this.formatCurrency(totalBalance);
        
        // Atualizar cards de resumo
        document.getElementById('accountsCount').textContent = this.financeData.accounts.length;
        document.getElementById('cardsCount').textContent = this.financeData.cards.length;
        document.getElementById('goalsCount').textContent = this.financeData.goals.length;
        
        // Calcular saldo total das contas
        const totalAccountsBalance = this.financeData.accounts.reduce((sum, acc) => 
            sum + parseFloat(acc.balance), 0);
        document.getElementById('totalAccountsBalance').textContent = this.formatCurrency(totalAccountsBalance);
        
        // Calcular limite total dos cartões
        const totalCreditLimit = this.financeData.cards.reduce((sum, card) => 
            sum + parseFloat(card.limit), 0);
        const totalUsedLimit = this.financeData.cards.reduce((sum, card) => 
            sum + parseFloat(card.used), 0);
        const availableCredit = totalCreditLimit - totalUsedLimit;
        
        document.getElementById('totalCreditLimit').textContent = this.formatCurrency(totalCreditLimit);
        document.getElementById('availableCredit').textContent = this.formatCurrency(availableCredit);
        
        // Calcular progresso das metas
        const activeGoals = this.financeData.goals.filter(g => g.status === 'active');
        if (activeGoals.length > 0) {
            const totalProgress = activeGoals.reduce((sum, goal) => {
                return sum + (parseFloat(goal.current) / parseFloat(goal.target));
            }, 0);
            const averageProgress = (totalProgress / activeGoals.length) * 100;
            document.getElementById('goalsProgress').textContent = `${averageProgress.toFixed(1)}%`;
            document.getElementById('goalsProgressBar').style.width = `${averageProgress}%`;
        }
        
        // Atualizar transações recentes
        this.updateRecentTransactions();
        
        // Atualizar gráficos
        this.updateDashboardCharts();
    }

    updateRecentTransactions() {
        const recentTransactions = document.getElementById('recentTransactions');
        if (!recentTransactions) return;
        
        const recent = this.financeData.transactions.slice(0, 5);
        recentTransactions.innerHTML = recent.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas fa-${transaction.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-category">${this.getCategoryName(transaction.category)}</div>
                    <div class="transaction-date">${new Date(transaction.date).toLocaleDateString('pt-BR')}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    R$ ${parseFloat(transaction.amount).toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    getCategoryName(categoryId) {
        if (!this.financeData.categories) return 'Geral';
        const category = this.financeData.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Geral';
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    // Métodos de autenticação
    async handleLogin(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) {
                // Tentar cadastrar se o usuário não existir
                if (error.message.includes('Invalid login credentials')) {
                    return await this.handleSignup(email, password);
                }
                throw error;
            }
            
            this.showNotification('Login realizado com sucesso!', 'success');
            return data;
            
        } catch (error) {
            console.error('Erro no login:', error);
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async handleSignup(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: email.split('@')[0],
                        avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=49ac2a&color=fff`
                    }
                }
            });
            
            if (error) throw error;
            
            this.showNotification('Cadastro realizado com sucesso!', 'success');
            return data;
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    async handleLogout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;
            
            this.showNotification('Logout realizado com sucesso!', 'success');
            this.showPage('logoutPage');
            
        } catch (error) {
            console.error('Erro no logout:', error);
            this.showNotification(error.message, 'error');
        }
    }

    // Métodos de notificações
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <div class="notification-content">${message}</div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Métodos de temas
    changeTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('financeapp-theme', theme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('financeapp-theme') || 'light';
        this.changeTheme(savedTheme);
    }

    // Métodos utilitários
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    // Métodos para modais
    openLoginModal() {
        document.getElementById('loginModal').classList.add('show');
    }

    closeLoginModal() {
        document.getElementById('loginModal').classList.remove('show');
    }

    openCardModal(card = null) {
        const modal = document.getElementById('cardModal');
        const form = document.getElementById('cardForm');
        
        if (card) {
            // Modo edição
            document.getElementById('cardBank').value = card.bank || '';
            document.getElementById('cardBrand').value = card.brand || '';
            document.getElementById('cardLast4').value = card.last4 || '';
            document.getElementById('cardLimit').value = card.limit || '';
            document.getElementById('cardDueDay').value = card.due_day || '';
            form.dataset.editId = card.id;
        } else {
            // Modo criação
            form.reset();
            delete form.dataset.editId;
        }
        
        modal.classList.add('show');
    }

    closeCardModal() {
        document.getElementById('cardModal').classList.remove('show');
        document.getElementById('cardForm').reset();
        delete document.getElementById('cardForm').dataset.editId;
    }

    async saveCard() {
        const form = document.getElementById('cardForm');
        const bank = document.getElementById('cardBank').value;
        const brand = document.getElementById('cardBrand').value;
        const last4 = document.getElementById('cardLast4').value;
        const limit = document.getElementById('cardLimit').value;
        const dueDay = document.getElementById('cardDueDay').value;
        
        if (!bank || !brand || !last4 || !limit || !dueDay) {
            this.showNotification('Preencha todos os campos', 'error');
            return;
        }
        
        const cardData = {
            bank,
            brand,
            last4,
            limit: parseFloat(limit.replace('R$', '').replace('.', '').replace(',', '.').trim()),
            due_day: parseInt(dueDay),
            used: 0
        };
        
        if (form.dataset.editId) {
            // Atualizar cartão existente
            const cardId = form.dataset.editId;
            const index = this.financeData.cards.findIndex(c => c.id === cardId);
            if (index !== -1) {
                this.financeData.cards[index] = { ...this.financeData.cards[index], ...cardData };
            }
        } else {
            // Criar novo cartão
            cardData.id = `card_${Date.now()}`;
            this.financeData.cards.unshift(cardData);
        }
        
        this.updateDashboard();
        this.closeCardModal();
        this.showNotification('Cartão salvo com sucesso!', 'success');
    }
}

// Inicializar aplicação globalmente
let financeApp;

document.addEventListener('DOMContentLoaded', () => {
    financeApp = new FinanceApp();
    
    // Carregar tema salvo
    financeApp.loadTheme();
    
    // Expor funções globais para uso no HTML
    window.financeApp = financeApp;
    
    // Funções globais para chamadas inline
    window.showPage = (page) => financeApp.showPage(page);
    window.toggleMenu = () => {
        const nav = document.getElementById('mainNav');
        nav.classList.toggle('show');
    };
    window.toggleUserMenu = () => {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('show');
    };
    window.openLoginModal = () => financeApp.openLoginModal();
    window.closeLoginModal = () => financeApp.closeLoginModal();
    window.openCardModal = (card) => financeApp.openCardModal(card);
    window.closeCardModal = () => financeApp.closeCardModal();
    window.saveCard = () => financeApp.saveCard();
    window.handleLogout = () => financeApp.handleLogout();
    window.changeTheme = (theme) => financeApp.changeTheme(theme);
    
    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-profile')) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.classList.remove('show');
        }
        
        if (!e.target.closest('.menu-toggle')) {
            const nav = document.getElementById('mainNav');
            if (nav && window.innerWidth <= 992) {
                nav.classList.remove('show');
            }
        }
    });
});

// Função para login via modal
async function handleModalLogin() {
    const email = document.getElementById('modalLoginEmail').value;
    const password = document.getElementById('modalLoginPassword').value;
    
    if (!email || !password) {
        financeApp.showNotification('Preencha todos os campos', 'error');
        return;
    }
    
    try {
        await financeApp.handleLogin(email, password);
        financeApp.closeLoginModal();
    } catch (error) {
        // Erro já tratado no método handleLogin
    }
}

// Funções para atualizar gráficos
function updateCategoryChart() {
    if (financeApp.charts) {
        const period = document.getElementById('categoryChartPeriod').value;
        financeApp.charts.updateCategoryChart(period);
    }
}

function updateIncomeExpenseChart() {
    if (financeApp.charts) {
        const months = document.getElementById('incomeExpensePeriod').value;
        financeApp.charts.updateIncomeExpenseChart(parseInt(months));
    }
}

function updateWealthChart() {
    if (financeApp.charts) {
        const months = document.getElementById('wealthPeriod').value;
        financeApp.charts.updateWealthChart(parseInt(months));
    }
}

function updateDashboard() {
    if (financeApp) {
        financeApp.updateDashboard();
    }
}