/* Dashboard View */
const Dashboard = (() => {
    let weeklyChart = null;

    async function render() {
        let spendings, categories;
        try {
            const [data, cats] = await Promise.all([
                API.spendings.list({ limit: 500 }),
                Categories.getCategories()
            ]);
            spendings = data.spendings || [];
            categories = cats || [];
        } catch (err) {
            return `<p class="text-muted text-center mt-24">Failed to load dashboard data</p>`;
        }

        const catMap = {};
        categories.forEach(c => catMap[c.id] = c);

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let weekTotal = 0;
        let monthTotal = 0;
        const dailyTotals = [0, 0, 0, 0, 0, 0, 0];

        spendings.forEach(s => {
            const d = new Date(s.date);
            const amt = parseFloat(s.amountUSD || s.amount);
            if (d >= startOfMonth) monthTotal += amt;
            if (d >= startOfWeek) {
                weekTotal += amt;
                const dayIndex = d.getDay();
                dailyTotals[dayIndex] += amt;
            }
        });

        const recentSpendings = spendings.slice(0, 10);

        const recentHtml = recentSpendings.length === 0
            ? `<div class="empty-state"><div class="empty-icon">💸</div><p>No expenses yet</p></div>`
            : recentSpendings.map(s => {
                const cat = catMap[s.categoryId];
                const catColor = Categories.getCategoryColor(cat);
                const catName = cat ? escapeHtml(cat.name) : 'Uncategorized';
                return `
                    <div class="list-item" onclick="App.navigate('spending/${s.id}')">
                        <div class="item-color" style="background:${catColor}"></div>
                        <div class="item-info">
                            <div class="item-title">${escapeHtml(s.comment || catName)}</div>
                            <div class="item-subtitle">${formatDate(s.date)}</div>
                        </div>
                        <div class="item-amount negative">${Currencies.format(s.amount, s.currency)}</div>
                    </div>
                `;
            }).join('');

        const html = `
            <div class="summary-row">
                <div class="summary-card">
                    <div class="summary-value">$${weekTotal.toFixed(2)}</div>
                    <div class="summary-label">This Week</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">$${monthTotal.toFixed(2)}</div>
                    <div class="summary-label">This Month</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header">
                    <span class="card-title">Weekly Spending</span>
                </div>
                <div class="chart-container">
                    <canvas id="weekly-chart"></canvas>
                </div>
            </div>
            <div class="section-header">
                <h3 class="section-title">Recent Expenses</h3>
                <a href="#spendings" class="text-muted" style="font-size:0.85rem">View all →</a>
            </div>
            ${recentHtml}
        `;

        setTimeout(() => initWeeklyChart(dailyTotals), 0);

        return html;
    }

    function initWeeklyChart(dailyTotals) {
        const canvas = document.getElementById('weekly-chart');
        if (!canvas) return;

        if (weeklyChart) {
            weeklyChart.destroy();
            weeklyChart = null;
        }

        const ctx = canvas.getContext('2d');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date().getDay();

        weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Spending ($)',
                    data: dailyTotals,
                    backgroundColor: days.map((_, i) =>
                        i === today ? '#00897B' : 'rgba(0, 137, 123, 0.3)'
                    ),
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (v) => '$' + v,
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
                        },
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border').trim(),
                        },
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
                        },
                        grid: { display: false },
                    }
                }
            }
        });
    }

    function destroy() {
        if (weeklyChart) {
            weeklyChart.destroy();
            weeklyChart = null;
        }
    }

    return { render, destroy };
})();
