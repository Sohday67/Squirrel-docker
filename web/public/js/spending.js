/* Spending Management */
const Spending = (() => {

    async function renderSpendingList() {
        let data, categories;
        try {
            [data, categories] = await Promise.all([
                API.spendings.list({ limit: 200 }),
                Categories.getCategories()
            ]);
        } catch (err) {
            return `<p class="text-muted text-center">Failed to load spendings</p>`;
        }

        const catMap = {};
        (categories || []).forEach(c => catMap[c.id] = c);

        const spendings = data.spendings || [];

        if (spendings.length === 0) {
            return `
                <div class="section-header">
                    <h2 class="section-title">All Spendings</h2>
                </div>
                <div class="empty-state">
                    <div class="empty-icon">💸</div>
                    <p>No spendings recorded yet</p>
                    <button class="btn btn-primary" onclick="App.navigate('add')">Add Your First Expense</button>
                </div>
            `;
        }

        // Group by date
        const grouped = {};
        spendings.forEach(s => {
            const dateKey = s.date ? s.date.substring(0, 10) : 'Unknown';
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(s);
        });

        const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

        let html = `
            <div class="section-header">
                <h2 class="section-title">All Spendings</h2>
                <span class="text-muted">${spendings.length} total</span>
            </div>
        `;

        sortedDates.forEach(dateKey => {
            const dayTotal = grouped[dateKey].reduce((sum, s) => sum + parseFloat(s.amountUSD || s.amount), 0);
            html += `<div class="mb-8 mt-16"><strong>${formatDate(dateKey)}</strong> <span class="text-muted" style="font-size:0.8rem">$${dayTotal.toFixed(2)}</span></div>`;
            grouped[dateKey].forEach(s => {
                const cat = catMap[s.categoryId];
                const catColor = Categories.getCategoryColor(cat);
                const catName = cat ? escapeHtml(cat.name) : 'Uncategorized';
                html += `
                    <div class="list-item" onclick="App.navigate('spending/${s.id}')">
                        <div class="item-color" style="background:${catColor}"></div>
                        <div class="item-info">
                            <div class="item-title">${escapeHtml(s.comment || catName)}</div>
                            <div class="item-subtitle">${catName}${s.place ? ' · ' + escapeHtml(s.place) : ''}</div>
                        </div>
                        <div class="item-amount negative">${Currencies.format(s.amount, s.currency)}</div>
                    </div>
                `;
            });
        });

        return html;
    }

    async function renderAddSpending() {
        let categories;
        try {
            categories = await Categories.getCategories();
        } catch (e) {
            categories = [];
        }

        const defaultCurrency = App.getDefaultCurrency();

        return `
            <h2 class="page-title">Add Expense</h2>
            <form id="spending-form" onsubmit="Spending.handleSave(event)">
                <div class="form-row">
                    <div class="form-group" style="flex:2">
                        <label for="sp-amount">Amount</label>
                        <input type="number" id="sp-amount" class="form-control" step="0.01" min="0.01" placeholder="0.00" required inputmode="decimal">
                    </div>
                    <div class="form-group" style="flex:3">
                        <label for="sp-currency">Currency</label>
                        ${Currencies.renderSearchableSelector('sp-currency', defaultCurrency)}
                    </div>
                </div>
                <div class="form-group">
                    <label for="sp-category">Category</label>
                    ${Categories.renderCategorySelector('sp-category', '', categories)}
                </div>
                <div class="form-group">
                    <label for="sp-comment">Comment</label>
                    <input type="text" id="sp-comment" class="form-control" placeholder="What was this for?">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="sp-place">Place</label>
                        <input type="text" id="sp-place" class="form-control" placeholder="Where?">
                    </div>
                    <div class="form-group">
                        <label for="sp-date">Date</label>
                        <input type="date" id="sp-date" class="form-control" value="${todayStr()}" required>
                    </div>
                </div>
                <div class="btn-group mt-16">
                    <button type="button" class="btn btn-secondary" onclick="App.navigate('dashboard')">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="sp-save-btn">Add Expense</button>
                </div>
            </form>
        `;
    }

    async function renderEditSpending(id) {
        let spending, categories;
        try {
            const [data, cats] = await Promise.all([
                API.spendings.list({ limit: 500 }),
                Categories.getCategories()
            ]);
            spending = data.spendings.find(s => s.id === id);
            categories = cats;
            if (!spending) throw new Error('Not found');
        } catch (err) {
            return `<p class="text-muted text-center">Spending not found</p>`;
        }

        return `
            <h2 class="page-title">Edit Expense</h2>
            <form id="spending-form" onsubmit="Spending.handleUpdate(event, '${spending.id}')">
                <div class="form-row">
                    <div class="form-group" style="flex:2">
                        <label for="sp-amount">Amount</label>
                        <input type="number" id="sp-amount" class="form-control" step="0.01" min="0.01" value="${spending.amount}" required inputmode="decimal">
                    </div>
                    <div class="form-group" style="flex:3">
                        <label for="sp-currency">Currency</label>
                        ${Currencies.renderSearchableSelector('sp-currency', spending.currency)}
                    </div>
                </div>
                <div class="form-group">
                    <label for="sp-category">Category</label>
                    ${Categories.renderCategorySelector('sp-category', spending.categoryId, categories)}
                </div>
                <div class="form-group">
                    <label for="sp-comment">Comment</label>
                    <input type="text" id="sp-comment" class="form-control" value="${escapeHtml(spending.comment || '')}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="sp-place">Place</label>
                        <input type="text" id="sp-place" class="form-control" value="${escapeHtml(spending.place || '')}">
                    </div>
                    <div class="form-group">
                        <label for="sp-date">Date</label>
                        <input type="date" id="sp-date" class="form-control" value="${spending.date ? spending.date.substring(0,10) : todayStr()}" required>
                    </div>
                </div>
                <div class="btn-group mt-16">
                    <button type="button" class="btn btn-secondary" onclick="history.back()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="sp-save-btn">Save Changes</button>
                </div>
            </form>
        `;
    }

    async function renderSpendingDetail(id) {
        let spending, categories, returns;
        try {
            const [data, cats, rets] = await Promise.all([
                API.spendings.list({ limit: 500 }),
                Categories.getCategories(),
                API.returns.list()
            ]);
            spending = data.spendings.find(s => s.id === id);
            categories = cats;
            returns = (rets || []).filter(r => r.spendingId === id);
            if (!spending) throw new Error('Not found');
        } catch (err) {
            return `<p class="text-muted text-center">Spending not found</p>`;
        }

        const catMap = {};
        (categories || []).forEach(c => catMap[c.id] = c);
        const cat = catMap[spending.categoryId];
        const catColor = Categories.getCategoryColor(cat);

        let returnsHtml = '';
        if (returns.length > 0) {
            returnsHtml = `
                <div class="section-header mt-24">
                    <h3 class="section-title">Returns</h3>
                    <button class="btn btn-sm btn-outline" onclick="App.navigate('returns/add/${spending.id}')">+ Add Return</button>
                </div>
            `;
            returns.forEach(r => {
                returnsHtml += `
                    <div class="list-item">
                        <div class="item-info">
                            <div class="item-title">${escapeHtml(r.name || 'Return')}</div>
                            <div class="item-subtitle">${formatDate(r.date)}</div>
                        </div>
                        <div class="item-amount positive">+${Currencies.format(r.amount, r.currency)}</div>
                        <button class="btn btn-sm btn-secondary" onclick="Returns.deleteReturn('${r.id}')" title="Delete">🗑️</button>
                    </div>
                `;
            });
        }

        return `
            <div class="flex-between mb-16">
                <button class="btn btn-secondary btn-sm" onclick="history.back()">← Back</button>
                <div class="btn-group">
                    <button class="btn btn-outline btn-sm" onclick="App.navigate('spending/edit/${spending.id}')">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="Spending.deleteSpending('${spending.id}')">Delete</button>
                </div>
            </div>
            <div class="card">
                <div class="flex-between mb-8">
                    <div class="flex gap-8" style="align-items:center">
                        <div class="item-color" style="background:${catColor};width:14px;height:14px"></div>
                        <span class="badge badge-primary">${cat ? escapeHtml(cat.name) : 'Uncategorized'}</span>
                    </div>
                    <span class="text-muted">${formatDate(spending.date)}</span>
                </div>
                <div style="font-size:2rem;font-weight:700;color:var(--danger);margin:12px 0">
                    ${Currencies.format(spending.amount, spending.currency)}
                </div>
                ${spending.comment ? `<p style="font-size:1rem;margin-bottom:4px">${escapeHtml(spending.comment)}</p>` : ''}
                ${spending.place ? `<p class="text-muted" style="font-size:0.9rem">📍 ${escapeHtml(spending.place)}</p>` : ''}
                ${spending.currency !== 'USD' ? `<p class="text-muted mt-8" style="font-size:0.85rem">≈ $${parseFloat(spending.amountUSD || 0).toFixed(2)} USD</p>` : ''}
            </div>
            ${returnsHtml}
            ${returns.length === 0 ? `
                <button class="btn btn-outline btn-block mt-16" onclick="App.navigate('returns/add/${spending.id}')">+ Add Return</button>
            ` : ''}
        `;
    }

    async function handleSave(e) {
        e.preventDefault();
        const btn = document.getElementById('sp-save-btn');
        btn.disabled = true;

        try {
            const amount = parseFloat(document.getElementById('sp-amount').value);
            const currency = document.getElementById('sp-currency').value;
            const categoryId = document.getElementById('sp-category').value || null;
            const comment = document.getElementById('sp-comment').value.trim();
            const place = document.getElementById('sp-place').value.trim();
            const date = document.getElementById('sp-date').value;

            if (!amount || amount <= 0) throw new Error('Amount must be positive');
            if (!date) throw new Error('Date is required');

            await API.spendings.create({
                amount,
                amountUSD: amount,
                currency,
                categoryId,
                comment: comment || null,
                place: place || null,
                date,
                timeZoneIdentifier: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });

            Categories.invalidateCache();
            App.toast('Expense added', 'success');
            App.navigate('dashboard');
        } catch (err) {
            App.toast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function handleUpdate(e, id) {
        e.preventDefault();
        const btn = document.getElementById('sp-save-btn');
        btn.disabled = true;

        try {
            const amount = parseFloat(document.getElementById('sp-amount').value);
            const currency = document.getElementById('sp-currency').value;
            const categoryId = document.getElementById('sp-category').value || null;
            const comment = document.getElementById('sp-comment').value.trim();
            const place = document.getElementById('sp-place').value.trim();
            const date = document.getElementById('sp-date').value;

            if (!amount || amount <= 0) throw new Error('Amount must be positive');

            await API.spendings.update(id, {
                amount,
                amountUSD: amount,
                currency,
                categoryId,
                comment: comment || null,
                place: place || null,
                date,
                timeZoneIdentifier: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });

            App.toast('Expense updated', 'success');
            App.navigate(`spending/${id}`);
        } catch (err) {
            App.toast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function deleteSpending(id) {
        App.showModal(`
            <h3 class="modal-title">Delete Expense</h3>
            <p>Are you sure you want to delete this expense? This action cannot be undone.</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="Spending.confirmDelete('${id}')">Delete</button>
            </div>
        `);
    }

    async function confirmDelete(id) {
        try {
            await API.spendings.delete(id);
            App.closeModal();
            App.toast('Expense deleted', 'success');
            App.navigate('dashboard');
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }

    return { renderSpendingList, renderAddSpending, renderEditSpending, renderSpendingDetail, handleSave, handleUpdate, deleteSpending, confirmDelete };
})();
