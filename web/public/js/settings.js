/* Settings View */
const Settings = (() => {

    async function render() {
        let user;
        try {
            const data = await API.auth.getMe();
            user = data.user || data;
        } catch (err) {
            user = null;
        }

        const currentTheme = localStorage.getItem('squirrel_theme') || 'system';
        const defaultCurrency = App.getDefaultCurrency();
        const privacyEnabled = localStorage.getItem('squirrel_privacy') === 'true';

        return `
            <h2 class="page-title">Settings</h2>

            ${user ? `
            <div class="card mb-16">
                <div class="card-title mb-8">Account</div>
                <div class="stat-item">
                    <span class="stat-name">Username</span>
                    <span class="stat-value">${escapeHtml(user.username)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-name">Email</span>
                    <span class="stat-value">${escapeHtml(user.email)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-name">Joined</span>
                    <span class="stat-value">${formatDate(user.createdAt)}</span>
                </div>
            </div>
            ` : ''}

            <div class="settings-item">
                <div>
                    <div class="settings-label">Default Currency</div>
                    <div class="settings-desc">Used for new expenses</div>
                </div>
                <div style="width:180px">
                    ${Currencies.renderSearchableSelector('settings-currency', defaultCurrency)}
                </div>
            </div>
            <div style="text-align:right;margin-bottom:16px">
                <button class="btn btn-sm btn-primary" onclick="Settings.saveCurrency()">Save Currency</button>
            </div>

            <div class="settings-item">
                <div>
                    <div class="settings-label">Theme</div>
                    <div class="settings-desc">Appearance preference</div>
                </div>
                <select class="form-control" style="width:130px" onchange="Settings.setTheme(this.value)" id="theme-select">
                    <option value="system" ${currentTheme === 'system' ? 'selected' : ''}>System</option>
                    <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
                    <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
                </select>
            </div>

            <div class="settings-item">
                <div>
                    <div class="settings-label">Privacy Screen</div>
                    <div class="settings-desc">Blur content when toggled</div>
                </div>
                <label class="toggle">
                    <input type="checkbox" ${privacyEnabled ? 'checked' : ''} onchange="Settings.togglePrivacy(this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>

            <div class="card mt-24">
                <div class="card-title mb-8">Two-Factor Authentication</div>
                ${user && user.twoFactorEnabled ? `
                    <p class="text-muted mb-8" style="font-size:0.9rem">✅ 2FA is enabled on your account</p>
                    <button class="btn btn-outline btn-block" onclick="Settings.showDisable2FA()">Disable 2FA</button>
                ` : `
                    <p class="text-muted mb-8" style="font-size:0.9rem">🔓 Add an extra layer of security</p>
                    <button class="btn btn-primary btn-block" onclick="Settings.setup2FA()">Setup 2FA</button>
                `}
            </div>

            <div class="card mt-16">
                <div class="card-title mb-8">Export Data</div>
                <div class="btn-group">
                    <button class="btn btn-outline" onclick="Settings.exportCSV()">📄 Export CSV</button>
                    <button class="btn btn-outline" onclick="Settings.exportJSON()">📋 Export JSON</button>
                </div>
            </div>

            <div class="mt-24 text-center">
                <button class="btn btn-danger btn-block" onclick="Settings.logout()">Log Out</button>
            </div>
        `;
    }

    function saveCurrency() {
        const code = document.getElementById('settings-currency').value;
        localStorage.setItem('squirrel_default_currency', code);
        App.toast(`Default currency set to ${code}`, 'success');
    }

    function setTheme(theme) {
        localStorage.setItem('squirrel_theme', theme);
        App.applyTheme();
        App.toast(`Theme: ${theme}`, 'success');
    }

    function togglePrivacy(enabled) {
        localStorage.setItem('squirrel_privacy', enabled);
        App.applyPrivacy();
    }

    async function setup2FA() {
        App.showModal(`
            <h3 class="modal-title">Setting up 2FA...</h3>
            <div class="loading-inline"><div class="spinner"></div></div>
        `);

        try {
            const data = await API.auth.setup2fa();
            App.showModal(`
                <h3 class="modal-title">Setup Two-Factor Auth</h3>
                <p class="text-muted" style="font-size:0.85rem">Scan this QR code with your authenticator app (Ente Auth, Google Authenticator, etc.)</p>
                <div class="twofa-qr">
                    <img src="${data.qrCode}" alt="2FA QR Code">
                </div>
                <p class="text-muted" style="font-size:0.8rem">Or enter this secret manually:</p>
                <div class="twofa-secret">${data.secret}</div>
                <form onsubmit="Settings.enable2FA(event)">
                    <div class="form-group">
                        <label for="setup-2fa-code">Verification Code</label>
                        <input type="text" id="setup-2fa-code" class="form-control" placeholder="000000"
                            required pattern="[0-9]{6}" maxlength="6" inputmode="numeric"
                            style="text-align:center;font-size:1.3rem;letter-spacing:6px">
                    </div>
                    <div id="setup-2fa-error" class="form-error" style="display:none"></div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="enable-2fa-btn">Enable 2FA</button>
                    </div>
                </form>
            `);
        } catch (err) {
            App.closeModal();
            App.toast(err.message, 'error');
        }
    }

    async function enable2FA(e) {
        e.preventDefault();
        const btn = document.getElementById('enable-2fa-btn');
        const errEl = document.getElementById('setup-2fa-error');
        btn.disabled = true;
        errEl.style.display = 'none';

        try {
            const code = document.getElementById('setup-2fa-code').value.trim();
            if (!code || code.length !== 6) throw new Error('Enter a 6-digit code');

            await API.auth.enable2fa({ code });
            App.closeModal();
            App.toast('2FA enabled!', 'success');
            App.navigate('settings');
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
        }
    }

    function showDisable2FA() {
        App.showModal(`
            <h3 class="modal-title">Disable 2FA</h3>
            <p class="text-muted" style="font-size:0.9rem">Enter your authenticator code to confirm disabling 2FA.</p>
            <form onsubmit="Settings.disable2FA(event)">
                <div class="form-group mt-16">
                    <label for="disable-2fa-code">Verification Code</label>
                    <input type="text" id="disable-2fa-code" class="form-control" placeholder="000000"
                        required pattern="[0-9]{6}" maxlength="6" inputmode="numeric"
                        style="text-align:center;font-size:1.3rem;letter-spacing:6px">
                </div>
                <div id="disable-2fa-error" class="form-error" style="display:none"></div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-danger" id="disable-2fa-btn">Disable 2FA</button>
                </div>
            </form>
        `);
    }

    async function disable2FA(e) {
        e.preventDefault();
        const btn = document.getElementById('disable-2fa-btn');
        const errEl = document.getElementById('disable-2fa-error');
        btn.disabled = true;
        errEl.style.display = 'none';

        try {
            const code = document.getElementById('disable-2fa-code').value.trim();
            if (!code || code.length !== 6) throw new Error('Enter a 6-digit code');

            await API.auth.disable2fa({ code });
            App.closeModal();
            App.toast('2FA disabled', 'success');
            App.navigate('settings');
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
        }
    }

    async function exportCSV() {
        try {
            App.toast('Preparing CSV...', 'info');
            const blob = await API.exportData.csv();
            downloadBlob(blob, `squirrel-export-${todayStr()}.csv`);
            App.toast('CSV downloaded', 'success');
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }

    async function exportJSON() {
        try {
            App.toast('Preparing JSON...', 'info');
            const data = await API.exportData.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            downloadBlob(blob, `squirrel-export-${todayStr()}.json`);
            App.toast('JSON downloaded', 'success');
        } catch (err) {
            App.toast(err.message, 'error');
        }
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function logout() {
        App.showModal(`
            <h3 class="modal-title">Log Out</h3>
            <p>Are you sure you want to log out?</p>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                <button class="btn btn-danger" onclick="Settings.confirmLogout()">Log Out</button>
            </div>
        `);
    }

    function confirmLogout() {
        API.clearToken();
        App.closeModal();
        window.location.hash = '#login';
        App.init();
    }

    return { render, saveCurrency, setTheme, togglePrivacy, setup2FA, enable2FA, showDisable2FA, disable2FA, exportCSV, exportJSON, logout, confirmLogout };
})();
