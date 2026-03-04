/* Categories Management */
const Categories = (() => {
    let cache = null;

    const COLORS = [
        '#E53935', '#D81B60', '#8E24AA', '#5E35B1',
        '#3949AB', '#1E88E5', '#039BE5', '#00ACC1',
        '#00897B', '#43A047', '#7CB342', '#C0CA33',
        '#FDD835', '#FFB300', '#FB8C00', '#F4511E',
        '#6D4C41', '#757575', '#546E7A', '#78909C',
        '#EF5350', '#EC407A', '#AB47BC', '#7E57C2',
        '#5C6BC0', '#42A5F5', '#29B6F6', '#26C6DA',
        '#26A69A', '#66BB6A', '#9CCC65', '#D4E157',
    ];

    async function getCategories(forceRefresh) {
        if (cache && !forceRefresh) return cache;
        cache = await API.categories.list();
        return cache;
    }

    function invalidateCache() {
        cache = null;
    }

    function getCategoryColor(cat) {
        return (cat && cat.color) || '#757575';
    }

    async function renderCategories() {
        let cats;
        try {
            cats = await getCategories(true);
        } catch (err) {
            return `<p class="text-muted text-center">Failed to load categories</p>`;
        }

        if (!cats || cats.length === 0) {
            return `
                <div class="section-header">
                    <h2 class="section-title">Categories</h2>
                    <button class="btn btn-primary btn-sm" onclick="App.navigate('categories/add')">+ Add</button>
                </div>
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <p>No categories yet</p>
                    <button class="btn btn-primary" onclick="App.navigate('categories/add')">Create Category</button>
                </div>
            `;
        }

        const items = cats.map(c => `
            <div class="list-item" onclick="App.navigate('categories/edit/${c.id}')">
                <div class="item-color" style="background:${getCategoryColor(c)}"></div>
                <div class="item-info">
                    <div class="item-title">${escapeHtml(c.name)}</div>
                    <div class="item-subtitle">
                        ${c.isFavorite ? '⭐ Favorite' : ''}
                        ${c.isShadowed ? '👁️ Hidden' : ''}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); Categories.deleteCategory('${c.id}', '${escapeHtml(c.name)}')" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');

        return `
            <div class="section-header">
                <h2 class="section-title">Categories</h2>
                <button class="btn btn-primary btn-sm" onclick="App.navigate('categories/add')">+ Add</button>
            </div>
            ${items}
        `;
    }

    function renderAddCategory() {
        return `
            <h2 class="page-title">New Category</h2>
            <form id="category-form" onsubmit="Categories.handleSave(event)">
                <div class="form-group">
                    <label for="cat-name">Name</label>
                    <input type="text" id="cat-name" class="form-control" placeholder="Category name" required>
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <div class="color-picker-grid" id="color-picker">
                        ${COLORS.map(c => `<div class="color-swatch" style="background:${c}" data-color="${c}" onclick="Categories.selectColor('${c}')"></div>`).join('')}
                    </div>
                    <input type="hidden" id="cat-color" value="${COLORS[8]}">
                </div>
                <div class="form-group">
                    <label class="flex gap-8" style="align-items:center">
                        <span>Favorite</span>
                        <label class="toggle">
                            <input type="checkbox" id="cat-favorite">
                            <span class="toggle-slider"></span>
                        </label>
                    </label>
                </div>
                <div class="btn-group mt-16">
                    <button type="button" class="btn btn-secondary" onclick="App.navigate('categories')">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="cat-save-btn">Create Category</button>
                </div>
            </form>
        `;
    }

    async function renderEditCategory(id) {
        let cat;
        try {
            const cats = await getCategories();
            cat = cats.find(c => c.id === id);
            if (!cat) throw new Error('Category not found');
        } catch (err) {
            return `<p class="text-muted text-center">Category not found</p>`;
        }

        setTimeout(() => {
            Categories.selectColor(cat.color || COLORS[8]);
        }, 0);

        return `
            <h2 class="page-title">Edit Category</h2>
            <form id="category-form" onsubmit="Categories.handleUpdate(event, '${cat.id}')">
                <div class="form-group">
                    <label for="cat-name">Name</label>
                    <input type="text" id="cat-name" class="form-control" value="${escapeHtml(cat.name)}" required>
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <div class="color-picker-grid" id="color-picker">
                        ${COLORS.map(c => `<div class="color-swatch ${c === cat.color ? 'selected' : ''}" style="background:${c}" data-color="${c}" onclick="Categories.selectColor('${c}')"></div>`).join('')}
                    </div>
                    <input type="hidden" id="cat-color" value="${cat.color || COLORS[8]}">
                </div>
                <div class="form-group">
                    <label class="flex gap-8" style="align-items:center">
                        <span>Favorite</span>
                        <label class="toggle">
                            <input type="checkbox" id="cat-favorite" ${cat.isFavorite ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </label>
                </div>
                <div class="form-group">
                    <label class="flex gap-8" style="align-items:center">
                        <span>Hidden</span>
                        <label class="toggle">
                            <input type="checkbox" id="cat-shadowed" ${cat.isShadowed ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </label>
                </div>
                <div class="btn-group mt-16">
                    <button type="button" class="btn btn-secondary" onclick="App.navigate('categories')">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="cat-save-btn">Save Changes</button>
                </div>
            </form>
        `;
    }

    function selectColor(color) {
        document.querySelectorAll('#color-picker .color-swatch').forEach(el => {
            el.classList.toggle('selected', el.dataset.color === color);
        });
        document.getElementById('cat-color').value = color;
    }

    async function handleSave(e) {
        e.preventDefault();
        const btn = document.getElementById('cat-save-btn');
        btn.disabled = true;

        try {
            const name = document.getElementById('cat-name').value.trim();
            const color = document.getElementById('cat-color').value;
            const isFavorite = document.getElementById('cat-favorite').checked;

            if (!name) throw new Error('Name is required');

            await API.categories.create({ name, color, isFavorite, isShadowed: false });
            invalidateCache();
            App.toast('Category created', 'success');
            App.navigate('categories');
        } catch (err) {
            App.toast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function handleUpdate(e, id) {
        e.preventDefault();
        const btn = document.getElementById('cat-save-btn');
        btn.disabled = true;

        try {
            const name = document.getElementById('cat-name').value.trim();
            const color = document.getElementById('cat-color').value;
            const isFavorite = document.getElementById('cat-favorite').checked;
            const isShadowed = document.getElementById('cat-shadowed') ? document.getElementById('cat-shadowed').checked : false;

            if (!name) throw new Error('Name is required');

            await API.categories.update(id, { name, color, isFavorite, isShadowed });
            invalidateCache();
            App.toast('Category updated', 'success');
            App.navigate('categories');
        } catch (err) {
            App.toast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    }

    async function deleteCategory(id, name) {
        App.showModal(`
            <h3 class="modal-title">Delete Category</h3>
            <p>Are you sure you want to delete "<strong>${name}</strong>"?</p>
            <p class="text-muted mt-8" style="font-size:0.85rem">Spendings linked to this category won't be deleted.</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="Categories.confirmDelete('${id}')">Delete</button>
            </div>
        `);
    }

    async function confirmDelete(id) {
        try {
            await API.categories.delete(id);
            invalidateCache();
            App.closeModal();
            App.toast('Category deleted', 'success');
            App.navigate('categories');
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }

    function renderCategorySelector(id, selectedId, categories) {
        const options = categories.map(c =>
            `<option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${c.name}</option>`
        ).join('');
        return `<select id="${id}" class="form-control">
            <option value="">No category</option>
            ${options}
        </select>`;
    }

    return { getCategories, invalidateCache, getCategoryColor, renderCategories, renderAddCategory, renderEditCategory, selectColor, handleSave, handleUpdate, deleteCategory, confirmDelete, renderCategorySelector, COLORS };
})();

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
