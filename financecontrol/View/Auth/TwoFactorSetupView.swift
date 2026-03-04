import SwiftUI

struct TwoFactorSetupView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var apiClient = APIClient.shared

    @State private var qrCodeData: String?
    @State private var secret: String = ""
    @State private var code = ""
    @State private var errorMessage = ""
    @State private var isLoading = false
    @State private var isSettingUp = true

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if isSettingUp {
                        ProgressView("Setting up 2FA...")
                    } else {
                        Image(systemName: "shield.checkered")
                            .font(.system(size: 50))
                            .foregroundColor(.accentColor)

                        Text("Set Up Two-Factor Authentication")
                            .font(.title3)
                            .fontWeight(.bold)

                        Text("Scan this QR code with your authenticator app (Ente Auth, Google Authenticator, etc.)")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)

                        if let qrData = qrCodeData, let url = URL(string: qrData) {
                            AsyncImage(url: url) { image in
                                image
                                    .resizable()
                                    .interpolation(.none)
                                    .scaledToFit()
                                    .frame(width: 200, height: 200)
                            } placeholder: {
                                ProgressView()
                                    .frame(width: 200, height: 200)
                            }
                        }

                        if !secret.isEmpty {
                            VStack(spacing: 4) {
                                Text("Manual Entry Key:")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Text(secret)
                                    .font(.system(.body, design: .monospaced))
                                    .textSelection(.enabled)
                            }
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                        }

                        Divider()
                            .padding(.vertical)

                        Text("Enter the 6-digit code from your authenticator to verify:")
                            .font(.subheadline)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)

                        TextField("000000", text: $code)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.center)
                            .font(.title2.monospacedDigit())
                            .frame(width: 200)
                            .onChange(of: code) { newValue in
                                code = String(newValue.prefix(6)).filter { $0.isNumber }
                            }

                        if !errorMessage.isEmpty {
                            Text(errorMessage)
                                .foregroundColor(.red)
                                .font(.caption)
                        }

                        Button(action: enable2FA) {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Enable 2FA")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .padding(.horizontal, 32)
                        .disabled(isLoading || code.count != 6)
                    }
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .task {
                await setupTwoFactor()
            }
        }
    }

    private func setupTwoFactor() async {
        do {
            let data = try await apiClient.setup2FA()
            await MainActor.run {
                self.qrCodeData = data.qrCode
                self.secret = data.secret ?? ""
                self.isSettingUp = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = error.localizedDescription
                self.isSettingUp = false
            }
        }
    }

    private func enable2FA() {
        isLoading = true
        errorMessage = ""

        Task {
            do {
                try await apiClient.enable2FA(code: code)
                await MainActor.run {
                    isLoading = false
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isLoading = false
                    errorMessage = error.localizedDescription
                }
            }
        }
    }
}
