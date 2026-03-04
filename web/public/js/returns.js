/* Returns Management */
const Returns = (() => {

    async function renderReturns() {
        let returns;
        try {
            returns = await API.returns.list();
        } catch (err) {
            return `<p class="text-muted text-center">Failed to load returns</p>`;
        }

        if (!returns || returns.length === 0) {
            return `
                <div class="section-header">
                    <h2 class="section-title">Returns & Refunds</h2>
                </div>
                <div class="empty-state">
                    <div class="empty-icon">💰</div>
                    <p>No returns yet</p>
                    <p class="text-muted" style="font-size:0.85rem">Returns can be added from a spending's detail page</p>
                </div>
            `;
        }

        const items = returns.map(r => {
            const spendingInfo = r.spending ? escapeHtml(r.spending.comment || 'Spending') : 'Unknown';
            return `
                <div class="list-item" onclick="App.navigate('returns/edit/${r.id}')">
                    <div class="item-info">
                        <div class="item-title">${escapeHtml(r.name || 'Return')}</div>
                        <div class="item-subtitle">From: ${spendingInfo} · ${formatDate(r.date)}</div>
                    </div>
                    <div class="item-amount positive">+${Currencies.format(r.amount, r.currency)}</div>
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); Returns.deleteReturn('${r.id}')" title="Delete">🗑️</button>
                </div>
            `;
        }).join('');

        return `
            <div class="section-header">
                <h2 class="section-title">Returns & Refunds</h2>
            </div>
            ${items}
        `;
    }

    function renderAddReturn(spendingId) {
        const defaultCurrency = App.getDefaultCurrency();
        return `
            <h2 class="page-title">Add Return</h2>
            <form id="return-form" onsubmit="Returns.handleSave(event, '${spendingId || ''}')">
                <div class="form-group">
                    <label for="ret-name">Name / Description</label>
                    <input type="text" id="ret-name" class="form-control" placeholder="Refund description">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ret-amount">Amount</label>
                        <input type="number" id="ret-amount" class="form-control" step="0.01" min="0.01" placeholder="0.00" required>
                    </div>
                    <div class="form-group">
                        <label for="ret-currency">Currency</label>
                        ${Currencies.renderSearchableSelector('ret-currency', defaultCurrency)}
                    </div>
                </div>
                <div class="form-group">
                    <label for="ret-date">Date</label>
                    <input type="date" id="ret-date" class="form-control" value="${todayStr()}" required>
                </div>
                ${!spendingId ? `
                <div class="form-group">
                    <label for="ret-spending">Linked Spending (optional)</label>
                    <select id="ret-spending" class="form-control">
                        <option value="">None</option>
                    </select>
                </div>
                ` : `<input type="hidden" id="ret-spending" value="${spendingId}">`}
                <div class="btn-group mt-16">
                    <button type="button" class="btn btn-secondary" onclick="history.back()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="ret-save-btn">Add Return</button>
                </div>
            </form>
        `;
    }

    async function renderEditReturn(id) {
        let ret;
        try {
            const returns = await API.returns.list();
            ret = returns.find(r => r.id === id);
            if (!ret) throw new Error('Return not found');
        } catch (err) {
            return `<p class="text-muted text-center">Return not found</p>`;
        }

        return `
            <h2 class="page-title">Edit Return</h2>
            <form id="return-form" onsubmit="Returns.handleUpdate(event, '${ret.id}')">
                <div class="form-group">
                    <label for="ret-name">Name / Description</label>
                    <input type="text" id="ret-name" class="form-control" value="${escapeHtml(ret.name || '')}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ret-amount">Amount</label>
                        <input type="number" id="ret-amount" class="form-control" step="0.01" min="0.01" value="${ret.amount}" required>
                    </div>
                    <div class="form-group">
                        <label for="ret-currency">Currency</label>
                        ${Currencies.renderSearchableSelector('ret-currency', ret.currency)}
                    </div>
                </div>
                <div class="form-group">
                    <label for="ret-date">Date</label>
                    <input type="date" id="ret-date" class="form-control" value="${ret.date ? ret.date.substring(0,10) : todayStr()}" required>
                </div>
                <div class="btn-group mt-16">
                    <button type="button" class="btn btn-secondary" onclick="history.back()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="ret-save-btn">Save Changes</button>
                </div>
            </form>
        `;
    }

    async function loadSpendingsDropdown() {
        const sel = document.getElementById('ret-spending');
        if (!sel || sel.type === 'hidden') return;
        try {
            const data = await API.spendings.list({ limit: 100 });
            data.spendings.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = `${formatDate(s.date)} - ${Currencies.format(s.amount, s.currency)} ${s.comment || ''}`;
                sel.appendChild(opt);
            });
        } catch (e) { /* ignore */ }
    }

    async function handleSave(e, spendingId) {
        e.preventDefault();
        const btn = document.getElementById('ret-save-btn');
        btn.disabled = true;

        try {
            const name = document.getElementById('ret-name').value.trim();
            const amount = parseFloat(document.getElementById('ret-amount').value);
            const currency = document.getElementById('ret-currency').value;
            const date = document.getElementById('ret-date').value;
            const linkedSpending = document.getElementById('ret-spending') ? document.getElementById('ret-spending').value : spendingId;

            if (!amount || amount <= 0) throw new Error('Amount must be positive');
            if (!date) throw new Error('Date is required');

            const payload = {
                name: name || null,
                amount,
                amountUSD: amount,
                currency,
                date,
                spendingId: linkedSpending || null,
            };

            await API.returns.create(payload);
            App.toast('Return added', 'success');
            if (spendingId) {
                App.navigate(`spending/${spendingId}`);
            } else {
                App.navigate('returns');
            }
        } catch (err) {
            App.toast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function handleUpdate(e, id) {
        e.preventDefault();
        const btn = document.getElementById('ret-save-btn');
        btn.disabled = true;

        try {
            const name = document.getElementById('ret-name').value.trim();
            const amount = parseFloat(document.getElementById('ret-amount').value);
            const currency = document.getElementById('ret-currency').value;
            const date = document.getElementById('ret-date').value;

            if (!amount || amount <= 0) throw new Error('Amount must be positive');

            await API.returns.update(id, {
                name: name || null,
                amount,
                amountUSD: amount,
                currency,
                date,
            });
            App.toast('Return updated', 'success');
            App.navigate('returns');
        } catch (err) {
            App.toast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function deleteReturn(id) {
        App.showModal(`
            <h3 class="modal-title">Delete Return</h3>
            <p>Are you sure you want to delete this return?</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="Returns.confirmDelete('${id}')">Delete</button>
            </div>
        `);
    }

    async function confirmDelete(id) {
        try {
            await API.returns.delete(id);
            App.closeModal();
            App.toast('Return deleted', 'success');
            App.navigate('returns');
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }

    return { renderReturns, renderAddReturn, renderEditReturn, loadSpendingsDropdown, handleSave, handleUpdate, deleteReturn, confirmDelete };
})();

function todayStr() {
    return new Date().toISOString().substring(0, 10);
}

function formatDate(d) {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
