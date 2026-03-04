/* Auth Views */
const Auth = (() => {

    function renderLogin() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">
                        <span class="logo-icon">🐿️</span>
                        <h2>Squirrel</h2>
                        <p>Expense Tracker</p>
                    </div>
                    <form id="login-form" onsubmit="Auth.handleLogin(event)">
                        <div class="form-group">
                            <label for="login-username">Username</label>
                            <input type="text" id="login-username" class="form-control" placeholder="Enter username" required autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label for="login-password">Password</label>
                            <input type="password" id="login-password" class="form-control" placeholder="Enter password" required autocomplete="current-password">
                        </div>
                        <div id="login-error" class="form-error mb-8" style="display:none"></div>
                        <button type="submit" class="btn btn-primary btn-block" id="login-btn">Log In</button>
                    </form>
                    <div class="auth-footer">
                        Don't have an account? <a href="#register">Sign up</a>
                    </div>
                </div>
            </div>
        `;
    }

    function renderRegister() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">
                        <span class="logo-icon">🐿️</span>
                        <h2>Create Account</h2>
                        <p>Start tracking your expenses</p>
                    </div>
                    <form id="register-form" onsubmit="Auth.handleRegister(event)">
                        <div class="form-group">
                            <label for="reg-username">Username</label>
                            <input type="text" id="reg-username" class="form-control" placeholder="Choose a username" required minlength="3" autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label for="reg-email">Email</label>
                            <input type="email" id="reg-email" class="form-control" placeholder="you@example.com" required autocomplete="email">
                        </div>
                        <div class="form-group">
                            <label for="reg-password">Password</label>
                            <input type="password" id="reg-password" class="form-control" placeholder="Min 8 characters" required minlength="8" autocomplete="new-password">
                        </div>
                        <div class="form-group">
                            <label for="reg-confirm">Confirm Password</label>
                            <input type="password" id="reg-confirm" class="form-control" placeholder="Repeat password" required autocomplete="new-password">
                        </div>
                        <div id="register-error" class="form-error mb-8" style="display:none"></div>
                        <button type="submit" class="btn btn-primary btn-block" id="register-btn">Create Account</button>
                    </form>
                    <div class="auth-footer">
                        Already have an account? <a href="#login">Log in</a>
                    </div>
                </div>
            </div>
        `;
    }

    function render2FAVerify(tempToken) {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-logo">
                        <span class="logo-icon">🔐</span>
                        <h2>Two-Factor Auth</h2>
                        <p>Enter the code from your authenticator app</p>
                    </div>
                    <form id="twofa-verify-form" onsubmit="Auth.handleVerify2FA(event)">
                        <input type="hidden" id="twofa-temp-token" value="${tempToken}">
                        <div class="form-group">
                            <label for="twofa-code">Authentication Code</label>
                            <input type="text" id="twofa-code" class="form-control" placeholder="000000"
                                required pattern="[0-9]{6}" maxlength="6" inputmode="numeric"
                                autocomplete="one-time-code" style="text-align:center;font-size:1.5rem;letter-spacing:8px">
                        </div>
                        <div id="twofa-error" class="form-error mb-8" style="display:none"></div>
                        <button type="submit" class="btn btn-primary btn-block" id="twofa-btn">Verify</button>
                    </form>
                    <div class="auth-footer">
                        <a href="#login">← Back to login</a>
                    </div>
                </div>
            </div>
        `;
    }

    async function handleLogin(e) {
        e.preventDefault();
        const btn = document.getElementById('login-btn');
        const errEl = document.getElementById('login-error');
        errEl.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Logging in...';

        try {
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            if (!username || !password) throw new Error('Please fill in all fields');

            const data = await API.auth.login({ username, password });

            if (data.requires2FA) {
                document.getElementById('app').innerHTML = render2FAVerify(data.tempToken);
                document.getElementById('twofa-code').focus();
            } else {
                API.setToken(data.token);
                App.toast('Welcome back!', 'success');
                window.location.hash = '#dashboard';
                App.init();
            }
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Log In';
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const btn = document.getElementById('register-btn');
        const errEl = document.getElementById('register-error');
        errEl.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Creating account...';

        try {
            const username = document.getElementById('reg-username').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;

            if (!username || !email || !password) throw new Error('Please fill in all fields');
            if (password.length < 8) throw new Error('Password must be at least 8 characters');
            if (password !== confirm) throw new Error('Passwords do not match');

            const data = await API.auth.register({ username, email, password });
            API.setToken(data.token);
            App.toast('Account created!', 'success');
            window.location.hash = '#dashboard';
            App.init();
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Create Account';
        }
    }

    async function handleVerify2FA(e) {
        e.preventDefault();
        const btn = document.getElementById('twofa-btn');
        const errEl = document.getElementById('twofa-error');
        errEl.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Verifying...';

        try {
            const tempToken = document.getElementById('twofa-temp-token').value;
            const code = document.getElementById('twofa-code').value.trim();

            if (!code || code.length !== 6) throw new Error('Please enter a 6-digit code');

            const data = await API.auth.verify2fa({ tempToken, code });
            API.setToken(data.token);
            App.toast('Welcome back!', 'success');
            window.location.hash = '#dashboard';
            App.init();
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Verify';
        }
    }

    return { renderLogin, renderRegister, render2FAVerify, handleLogin, handleRegister, handleVerify2FA };
})();
