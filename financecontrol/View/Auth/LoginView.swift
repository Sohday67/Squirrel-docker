import SwiftUI

struct LoginView: View {
    @ObservedObject private var apiClient = APIClient.shared

    @State private var username = ""
    @State private var password = ""
    @State private var errorMessage = ""
    @State private var isLoading = false
    @State private var showRegister = false
    @State private var show2FA = false
    @State private var tempToken = ""

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Spacer()

                Image(systemName: "leaf.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.accentColor)

                Text("Squirrel")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text("Sign in to sync your data")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                VStack(spacing: 16) {
                    TextField("Username", text: $username)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.username)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)

                    SecureField("Password", text: $password)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.password)
                }
                .padding(.horizontal, 32)

                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }

                Button(action: login) {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Sign In")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.accentColor)
                .foregroundColor(.white)
                .cornerRadius(12)
                .padding(.horizontal, 32)
                .disabled(isLoading || username.isEmpty || password.isEmpty)

                Button("Create Account") {
                    showRegister = true
                }
                .font(.subheadline)

                Spacer()

                Button("Continue without account") {
                    UserDefaults.standard.set(true, forKey: "skipAuth")
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $showRegister) {
                RegisterView()
            }
            .sheet(isPresented: $show2FA) {
                TwoFactorVerifyView(tempToken: tempToken)
            }
        }
    }

    private func login() {
        isLoading = true
        errorMessage = ""

        Task {
            do {
                let result = try await apiClient.login(username: username, password: password)
                await MainActor.run {
                    isLoading = false
                    if result.requires2FA == true, let token = result.tempToken {
                        tempToken = token
                        show2FA = true
                    }
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
