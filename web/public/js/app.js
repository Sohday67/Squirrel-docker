/* Main Application Controller */
const App = (() => {
    let currentView = null;

    function init() {
        applyTheme();
        applyPrivacy();
        route();
    }

    function getDefaultCurrency() {
        return localStorage.getItem('squirrel_default_currency') || 'USD';
    }

    function applyTheme() {
        const theme = localStorage.getItem('squirrel_theme') || 'system';
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    function applyPrivacy() {
        const enabled = localStorage.getItem('squirrel_privacy') === 'true';
        document.body.classList.toggle('privacy-blur', enabled);
    }

    async function route() {
        const hash = window.location.hash.slice(1) || 'dashboard';

        // Destroy previous charts
        if (currentView === 'dashboard') Dashboard.destroy();
        if (currentView === 'stats') Stats.destroy();

        // Check auth
        if (!API.isAuthenticated() && !['login', 'register'].includes(hash)) {
            window.location.hash = '#login';
            return;
        }

        if (hash === 'login') {
            document.getElementById('app').innerHTML = Auth.renderLogin();
            currentView = 'login';
            return;
        }

        if (hash === 'register') {
            document.getElementById('app').innerHTML = Auth.renderRegister();
            currentView = 'register';
            return;
        }

        // Authenticated views
        let content = '';
        let activeNav = '';

        if (hash === 'dashboard') {
            activeNav = 'dashboard';
            content = await Dashboard.render();
            currentView = 'dashboard';
        } else if (hash === 'add') {
            activeNav = 'add';
            content = await Spending.renderAddSpending();
            currentView = 'add';
        } else if (hash === 'spendings') {
            activeNav = 'dashboard';
            content = await Spending.renderSpendingList();
            currentView = 'spendings';
        } else if (hash.startsWith('spending/edit/')) {
            activeNav = 'dashboard';
            const id = hash.split('/')[2];
            content = await Spending.renderEditSpending(id);
            currentView = 'spending-edit';
        } else if (hash.startsWith('spending/')) {
            activeNav = 'dashboard';
            const id = hash.split('/')[1];
            content = await Spending.renderSpendingDetail(id);
            currentView = 'spending-detail';
        } else if (hash === 'stats') {
            activeNav = 'stats';
            content = await Stats.render();
            currentView = 'stats';
        } else if (hash === 'categories') {
            activeNav = 'settings';
            content = await Categories.renderCategories();
            currentView = 'categories';
        } else if (hash === 'categories/add') {
            activeNav = 'settings';
            content = Categories.renderAddCategory();
            currentView = 'categories-add';
        } else if (hash.startsWith('categories/edit/')) {
            activeNav = 'settings';
            const id = hash.split('/')[2];
            content = await Categories.renderEditCategory(id);
            currentView = 'categories-edit';
        } else if (hash === 'returns') {
            activeNav = 'dashboard';
            content = await Returns.renderReturns();
            currentView = 'returns';
        } else if (hash.startsWith('returns/add/')) {
            activeNav = 'dashboard';
            const spendingId = hash.split('/')[2];
            content = Returns.renderAddReturn(spendingId);
            currentView = 'returns-add';
            setTimeout(() => Returns.loadSpendingsDropdown(), 0);
        } else if (hash === 'returns/add') {
            activeNav = 'dashboard';
            content = Returns.renderAddReturn('');
            currentView = 'returns-add';
            setTimeout(() => Returns.loadSpendingsDropdown(), 0);
        } else if (hash.startsWith('returns/edit/')) {
            activeNav = 'dashboard';
            const id = hash.split('/')[2];
            content = await Returns.renderEditReturn(id);
            currentView = 'returns-edit';
        } else if (hash === 'settings') {
            activeNav = 'settings';
            content = await Settings.render();
            currentView = 'settings';
        } else {
            activeNav = 'dashboard';
            content = await Dashboard.render();
            currentView = 'dashboard';
        }

        renderLayout(content, activeNav);
    }

    function renderLayout(content, activeNav) {
        const privacyBtn = localStorage.getItem('squirrel_privacy') === 'true'
            ? `<button class="header-btn" onclick="App.togglePrivacyScreen()" title="Toggle Privacy">👁️</button>`
            : '';

        document.getElementById('app').innerHTML = `
            <div class="app-layout">
                <div class="app-header">
                    <h1>🐿️ Squirrel</h1>
                    <div class="header-actions">
                        ${privacyBtn}
                    </div>
                </div>
                <div class="desktop-layout">
                    <nav class="bottom-nav">
                        <a href="#dashboard" class="nav-item ${activeNav === 'dashboard' ? 'active' : ''}">
                            <span class="nav-icon">🏠</span>
                            <span>Dashboard</span>
                        </a>
                        <a href="#add" class="nav-item ${activeNav === 'add' ? 'active' : ''}">
                            <span class="nav-icon">➕</span>
                            <span>Add</span>
                        </a>
                        <a href="#categories" class="nav-item ${activeNav === 'categories' ? 'active' : ''}">
                            <span class="nav-icon">📁</span>
                            <span>Categories</span>
                        </a>
                        <a href="#returns" class="nav-item ${activeNav === 'returns' ? 'active' : ''}">
                            <span class="nav-icon">💰</span>
                            <span>Returns</span>
                        </a>
                        <a href="#stats" class="nav-item ${activeNav === 'stats' ? 'active' : ''}">
                            <span class="nav-icon">📊</span>
                            <span>Stats</span>
                        </a>
                        <a href="#settings" class="nav-item ${activeNav === 'settings' ? 'active' : ''}">
                            <span class="nav-icon">⚙️</span>
                            <span>Settings</span>
                        </a>
                    </nav>
                    <main class="app-main">
                        ${content}
                    </main>
                </div>
            </div>
        `;
    }

    function navigate(path) {
        window.location.hash = '#' + path;
    }

    function togglePrivacyScreen() {
        document.body.classList.toggle('privacy-blur');
    }

    // Toast notifications
    function toast(message, type) {
        type = type || 'info';
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(100px)';
            el.style.transition = 'all 0.3s';
            setTimeout(() => el.remove(), 300);
        }, 3000);
    }

    // Modal
    function showModal(html) {
        document.getElementById('modal-body').innerHTML = html;
        document.getElementById('modal-overlay').classList.remove('hidden');
    }

    function closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('modal-body').innerHTML = '';
    }

    // Listen for hash changes
    window.addEventListener('hashchange', route);
    window.addEventListener('DOMContentLoaded', init);

    return { init, navigate, toast, showModal, closeModal, getDefaultCurrency, applyTheme, applyPrivacy, togglePrivacyScreen };
})();
