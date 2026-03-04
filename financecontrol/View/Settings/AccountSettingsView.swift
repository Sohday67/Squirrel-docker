import SwiftUI

struct AccountSettingsView: View {
    @ObservedObject private var apiClient = APIClient.shared
    @ObservedObject private var syncManager = SyncManager.shared

    @State private var showSetup2FA = false
    @State private var showDisable2FA = false
    @State private var disable2FACode = ""
    @State private var serverURL: String = UserDefaults.standard.string(forKey: "serverURL") ?? "http://localhost:3001"
    @State private var iCloudBackupEnabled: Bool = UserDefaults.standard.bool(forKey: "iCloudBackupEnabled")
    @State private var showLogoutConfirm = false
    @State private var errorMessage = ""

    var body: some View {
        Form {
            if apiClient.isAuthenticated, let user = apiClient.currentUser {
                Section(header: Text("Account")) {
                    HStack {
                        Text("Username")
                        Spacer()
                        Text(user.username)
                            .foregroundColor(.secondary)
                    }
                    HStack {
                        Text("Email")
                        Spacer()
                        Text(user.email)
                            .foregroundColor(.secondary)
                    }
                }

                Section(header: Text("Two-Factor Authentication")) {
                    if user.twoFactorEnabled {
                        HStack {
                            Image(systemName: "checkmark.shield.fill")
                                .foregroundColor(.green)
                            Text("2FA is enabled")
                        }
                        Button("Disable 2FA", role: .destructive) {
                            showDisable2FA = true
                        }
                    } else {
                        HStack {
                            Image(systemName: "shield.slash")
                                .foregroundColor(.orange)
                            Text("2FA is not enabled")
                        }
                        Button("Set Up 2FA") {
                            showSetup2FA = true
                        }
                    }
                }

                Section(header: Text("Data Sync")) {
                    Button(action: {
                        Task { await syncManager.syncAllData() }
                    }) {
                        HStack {
                            Text("Sync Now")
                            Spacer()
                            if syncManager.isSyncing {
                                ProgressView()
                            }
                        }
                    }
                    .disabled(syncManager.isSyncing)

                    if let lastSync = syncManager.lastSyncDate {
                        HStack {
                            Text("Last Sync")
                            Spacer()
                            Text(lastSync, style: .relative)
                                .foregroundColor(.secondary)
                        }
                    }

                    if let error = syncManager.syncError {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }

                Section(header: Text("iCloud Backup")) {
                    Toggle("Backup to iCloud", isOn: $iCloudBackupEnabled)
                        .onChange(of: iCloudBackupEnabled) { newValue in
                            UserDefaults.standard.set(newValue, forKey: "iCloudBackupEnabled")
                        }

                    if iCloudBackupEnabled {
                        Text("Your data will be backed up to iCloud in addition to server sync.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Section {
                    Button("Sign Out", role: .destructive) {
                        showLogoutConfirm = true
                    }
                }
            } else {
                Section(header: Text("Server")) {
                    TextField("Server URL", text: $serverURL)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .keyboardType(.URL)
                        .onChange(of: serverURL) { newValue in
                            UserDefaults.standard.set(newValue, forKey: "serverURL")
                        }
                }

                Section {
                    Text("Sign in to sync your data across devices and the web.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Account & Sync")
        .sheet(isPresented: $showSetup2FA) {
            TwoFactorSetupView()
        }
        .alert("Disable 2FA", isPresented: $showDisable2FA) {
            TextField("Enter 2FA code", text: $disable2FACode)
                .keyboardType(.numberPad)
            Button("Disable", role: .destructive) {
                Task {
                    do {
                        try await apiClient.disable2FA(code: disable2FACode)
                        disable2FACode = ""
                    } catch {
                        errorMessage = error.localizedDescription
                    }
                }
            }
            Button("Cancel", role: .cancel) {
                disable2FACode = ""
            }
        } message: {
            Text("Enter the code from your authenticator app to disable 2FA.")
        }
        .alert("Sign Out", isPresented: $showLogoutConfirm) {
            Button("Sign Out", role: .destructive) {
                apiClient.logout()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to sign out? Your local data will be preserved.")
        }
    }
}
