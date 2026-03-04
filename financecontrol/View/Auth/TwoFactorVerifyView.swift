import SwiftUI

struct TwoFactorVerifyView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var apiClient = APIClient.shared

    let tempToken: String

    @State private var code = ""
    @State private var errorMessage = ""
    @State private var isLoading = false

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "lock.shield.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.accentColor)

                Text("Two-Factor Authentication")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Enter the 6-digit code from your authenticator app (e.g., Ente Auth)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)

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

                Button(action: verify) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Verify")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.accentColor)
                .foregroundColor(.white)
                .cornerRadius(12)
                .padding(.horizontal, 32)
                .disabled(isLoading || code.count != 6)

                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func verify() {
        isLoading = true
        errorMessage = ""

        Task {
            do {
                let _ = try await apiClient.verify2FA(code: code, tempToken: tempToken)
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
