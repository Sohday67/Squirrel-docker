/* Statistics View */
const Stats = (() => {
    let pieChart = null;

    async function render() {
        let spendings, categories;
        try {
            const [data, cats] = await Promise.all([
                API.spendings.list({ limit: 2000 }),
                Categories.getCategories()
            ]);
            spendings = data.spendings || [];
            categories = cats || [];
        } catch (err) {
            return `<p class="text-muted text-center mt-24">Failed to load statistics</p>`;
        }

        const html = `
            <h2 class="page-title">Statistics</h2>
            <div class="filter-bar">
                <span class="filter-chip active" data-period="week" onclick="Stats.setPeriod('week')">Week</span>
                <span class="filter-chip" data-period="month" onclick="Stats.setPeriod('month')">Month</span>
                <span class="filter-chip" data-period="year" onclick="Stats.setPeriod('year')">Year</span>
                <span class="filter-chip" data-period="all" onclick="Stats.setPeriod('all')">All Time</span>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Spending by Category</span>
                    <span class="text-muted" id="stats-total"></span>
                </div>
                <div class="chart-container" style="max-height:260px">
                    <canvas id="pie-chart"></canvas>
                </div>
            </div>
            <div class="card" id="stats-categories-list">
                <div class="card-title mb-8">Top Categories</div>
                <div id="category-breakdown"></div>
            </div>
            <div class="card" id="stats-currency-breakdown">
                <div class="card-title mb-8">By Currency</div>
                <div id="currency-breakdown"></div>
            </div>
        `;

        // Store data for filtering
        Stats._spendings = spendings;
        Stats._categories = categories;

        setTimeout(() => Stats.updateStats('week'), 0);

        return html;
    }

    function setPeriod(period) {
        document.querySelectorAll('.filter-chip').forEach(el => {
            el.classList.toggle('active', el.dataset.period === period);
        });
        updateStats(period);
    }

    function updateStats(period) {
        const spendings = Stats._spendings || [];
        const categories = Stats._categories || [];

        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay());
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(0);
        }

        const filtered = spendings.filter(s => new Date(s.date) >= startDate);

        // Category breakdown
        const catMap = {};
        categories.forEach(c => catMap[c.id] = c);

        const byCat = {};
        let total = 0;
        const byCurrency = {};

        filtered.forEach(s => {
            const amt = parseFloat(s.amountUSD || s.amount);
            const catId = s.categoryId || '_uncategorized';
            byCat[catId] = (byCat[catId] || 0) + amt;
            total += amt;

            const curr = s.currency || 'USD';
            byCurrency[curr] = (byCurrency[curr] || 0) + parseFloat(s.amount);
        });

        // Update total
        const totalEl = document.getElementById('stats-total');
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

        // Pie chart
        const catEntries = Object.entries(byCat)
            .sort((a, b) => b[1] - a[1]);

        const labels = [];
        const values = [];
        const colors = [];

        catEntries.forEach(([catId, amount]) => {
            if (catId === '_uncategorized') {
                labels.push('Uncategorized');
                colors.push('#9E9E9E');
            } else {
                const cat = catMap[catId];
                labels.push(cat ? cat.name : 'Unknown');
                colors.push(cat ? Categories.getCategoryColor(cat) : '#9E9E9E');
            }
            values.push(amount);
        });

        renderPieChart(labels, values, colors);

        // Category breakdown list
        const breakdownEl = document.getElementById('category-breakdown');
        if (breakdownEl) {
            if (catEntries.length === 0) {
                breakdownEl.innerHTML = '<p class="text-muted text-center">No data for this period</p>';
            } else {
                breakdownEl.innerHTML = catEntries.map(([catId, amount], i) => {
                    const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
                    return `
                        <div class="stat-item">
                            <div class="stat-color" style="background:${colors[i]}"></div>
                            <span class="stat-name">${escapeHtml(labels[i])}</span>
                            <span class="stat-value">$${amount.toFixed(2)}</span>
                            <span class="stat-pct">${pct}%</span>
                        </div>
                    `;
                }).join('');
            }
        }

        // Currency breakdown
        const currBreakdownEl = document.getElementById('currency-breakdown');
        if (currBreakdownEl) {
            const currEntries = Object.entries(byCurrency).sort((a, b) => b[1] - a[1]);
            if (currEntries.length === 0) {
                currBreakdownEl.innerHTML = '<p class="text-muted text-center">No data</p>';
            } else {
                currBreakdownEl.innerHTML = currEntries.map(([code, amount]) => `
                    <div class="stat-item">
                        <span class="stat-name"><strong>${code}</strong> - ${Currencies.getByCode(code).name}</span>
                        <span class="stat-value">${Currencies.format(amount, code)}</span>
                    </div>
                `).join('');
            }
        }
    }

    function renderPieChart(labels, values, colors) {
        const canvas = document.getElementById('pie-chart');
        if (!canvas) return;

        if (pieChart) {
            pieChart.destroy();
            pieChart = null;
        }

        if (values.length === 0) {
            canvas.style.display = 'none';
            return;
        }
        canvas.style.display = 'block';

        const ctx = canvas.getContext('2d');
        pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim(),
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 12,
                            usePointStyle: true,
                            pointStyleWidth: 10,
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text').trim(),
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((ctx.parsed / total) * 100).toFixed(1);
                                return ` ${ctx.label}: $${ctx.parsed.toFixed(2)} (${pct}%)`;
                            }
                        }
                    }
                },
                cutout: '55%',
            }
        });
    }

    function destroy() {
        if (pieChart) {
            pieChart.destroy();
            pieChart = null;
        }
        Stats._spendings = null;
        Stats._categories = null;
    }

    return { render, setPeriod, updateStats, destroy };
})();
