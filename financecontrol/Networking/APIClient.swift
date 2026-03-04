import Foundation

class APIClient: ObservableObject {
    static let shared = APIClient()

    @Published var isAuthenticated = false
    @Published var currentUser: UserProfile?

    private var baseURL: String {
        UserDefaults.standard.string(forKey: "serverURL") ?? "http://localhost:3001"
    }

    private var authToken: String? {
        get { KeychainHelper.load(key: "authToken") }
        set {
            if let value = newValue {
                KeychainHelper.save(key: "authToken", value: value)
            } else {
                KeychainHelper.delete(key: "authToken")
            }
        }
    }

    struct UserProfile: Codable {
        let id: String
        let username: String
        let email: String
        let twoFactorEnabled: Bool
    }

    struct AuthResponse: Codable {
        let success: Bool
        let data: AuthData?
        let error: String?
    }

    struct AuthData: Codable {
        let token: String?
        let user: UserProfile?
        let requires2FA: Bool?
        let tempToken: String?
        let qrCode: String?
        let secret: String?
        let otpauthUrl: String?
    }

    struct APIResponse<T: Codable>: Codable {
        let success: Bool
        let data: T?
        let error: String?
    }

    // MARK: - Auth Methods

    func register(username: String, email: String, password: String) async throws -> AuthData {
        let body: [String: Any] = ["username": username, "email": email, "password": password]
        let response: AuthResponse = try await request(path: "/api/auth/register", method: "POST", body: body)
        guard response.success, let data = response.data else {
            throw APIError.serverError(response.error ?? "Registration failed")
        }
        if let token = data.token {
            self.authToken = token
            await MainActor.run { self.isAuthenticated = true }
        }
        if let user = data.user {
            await MainActor.run { self.currentUser = user }
        }
        return data
    }

    func login(username: String, password: String) async throws -> AuthData {
        let body: [String: Any] = ["username": username, "password": password]
        let response: AuthResponse = try await request(path: "/api/auth/login", method: "POST", body: body)
        guard response.success, let data = response.data else {
            throw APIError.serverError(response.error ?? "Login failed")
        }
        if let token = data.token {
            self.authToken = token
            await MainActor.run { self.isAuthenticated = true }
        }
        if let user = data.user {
            await MainActor.run { self.currentUser = user }
        }
        return data
    }

    func verify2FA(code: String, tempToken: String) async throws -> AuthData {
        let body: [String: Any] = ["code": code, "tempToken": tempToken]
        let response: AuthResponse = try await request(path: "/api/auth/verify-2fa", method: "POST", body: body)
        guard response.success, let data = response.data else {
            throw APIError.serverError(response.error ?? "2FA verification failed")
        }
        if let token = data.token {
            self.authToken = token
            await MainActor.run { self.isAuthenticated = true }
        }
        if let user = data.user {
            await MainActor.run { self.currentUser = user }
        }
        return data
    }

    func setup2FA() async throws -> AuthData {
        let response: AuthResponse = try await request(path: "/api/auth/setup-2fa", method: "POST", body: nil)
        guard response.success, let data = response.data else {
            throw APIError.serverError(response.error ?? "2FA setup failed")
        }
        return data
    }

    func enable2FA(code: String) async throws {
        let body: [String: Any] = ["code": code]
        let response: AuthResponse = try await request(path: "/api/auth/enable-2fa", method: "POST", body: body)
        guard response.success else {
            throw APIError.serverError(response.error ?? "Failed to enable 2FA")
        }
        await fetchUserProfile()
    }

    func disable2FA(code: String) async throws {
        let body: [String: Any] = ["code": code]
        let response: AuthResponse = try await request(path: "/api/auth/disable-2fa", method: "POST", body: body)
        guard response.success else {
            throw APIError.serverError(response.error ?? "Failed to disable 2FA")
        }
        await fetchUserProfile()
    }

    func fetchUserProfile() async {
        do {
            let response: AuthResponse = try await request(path: "/api/auth/me", method: "GET", body: nil)
            if response.success, let data = response.data, let user = data.user {
                await MainActor.run {
                    self.currentUser = user
                    self.isAuthenticated = true
                }
            }
        } catch {
            await MainActor.run {
                self.isAuthenticated = false
                self.currentUser = nil
            }
        }
    }

    func logout() {
        self.authToken = nil
        DispatchQueue.main.async {
            self.isAuthenticated = false
            self.currentUser = nil
        }
    }

    // MARK: - Sync Methods

    struct SpendingDTO: Codable {
        let id: String
        let amount: Double
        let amountUSD: Double
        let currency: String
        let categoryId: String?
        let comment: String?
        let place: String?
        let date: String
        let timeZoneIdentifier: String?
    }

    struct CategoryDTO: Codable {
        let id: String
        let name: String
        let color: String?
        let isShadowed: Bool
        let isFavorite: Bool
    }

    struct ReturnDTO: Codable {
        let id: String
        let spendingId: String?
        let amount: Double
        let amountUSD: Double
        let currency: String
        let name: String?
        let date: String
    }

    func syncCategories(_ categories: [CategoryDTO]) async throws -> [CategoryDTO] {
        let body: [String: Any] = ["categories": categories.map { cat in
            ["id": cat.id, "name": cat.name, "color": cat.color as Any, "isShadowed": cat.isShadowed, "isFavorite": cat.isFavorite] as [String: Any]
        }]
        let response: APIResponse<[CategoryDTO]> = try await request(path: "/api/categories/sync", method: "POST", body: body)
        return response.data ?? []
    }

    func syncSpendings(_ spendings: [SpendingDTO]) async throws -> [SpendingDTO] {
        let body: [String: Any] = ["spendings": spendings.map { s in
            ["id": s.id, "amount": s.amount, "amountUSD": s.amountUSD, "currency": s.currency, "categoryId": s.categoryId as Any, "comment": s.comment as Any, "place": s.place as Any, "date": s.date, "timeZoneIdentifier": s.timeZoneIdentifier as Any] as [String: Any]
        }]
        let response: APIResponse<[SpendingDTO]> = try await request(path: "/api/spendings/sync", method: "POST", body: body)
        return response.data ?? []
    }

    func syncReturns(_ returns: [ReturnDTO]) async throws -> [ReturnDTO] {
        let body: [String: Any] = ["returns": returns.map { r in
            ["id": r.id, "spendingId": r.spendingId as Any, "amount": r.amount, "amountUSD": r.amountUSD, "currency": r.currency, "name": r.name as Any, "date": r.date] as [String: Any]
        }]
        let response: APIResponse<[ReturnDTO]> = try await request(path: "/api/returns/sync", method: "POST", body: body)
        return response.data ?? []
    }

    func fetchSpendings() async throws -> [SpendingDTO] {
        let response: APIResponse<[SpendingDTO]> = try await request(path: "/api/spendings", method: "GET", body: nil)
        return response.data ?? []
    }

    func fetchCategories() async throws -> [CategoryDTO] {
        let response: APIResponse<[CategoryDTO]> = try await request(path: "/api/categories", method: "GET", body: nil)
        return response.data ?? []
    }

    func fetchReturns() async throws -> [ReturnDTO] {
        let response: APIResponse<[ReturnDTO]> = try await request(path: "/api/returns", method: "GET", body: nil)
        return response.data ?? []
    }

    // MARK: - Network

    enum APIError: LocalizedError {
        case invalidURL
        case networkError(Error)
        case decodingError(Error)
        case serverError(String)
        case unauthorized

        var errorDescription: String? {
            switch self {
            case .invalidURL: return "Invalid server URL"
            case .networkError(let error): return "Network error: \(error.localizedDescription)"
            case .decodingError(let error): return "Data error: \(error.localizedDescription)"
            case .serverError(let message): return message
            case .unauthorized: return "Please log in again"
            }
        }
    }

    private func request<T: Codable>(path: String, method: String, body: [String: Any]?) async throws -> T {
        guard let url = URL(string: baseURL + path) else {
            throw APIError.invalidURL
        }

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            urlRequest.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: urlRequest)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(URLError(.badServerResponse))
        }

        if httpResponse.statusCode == 401 {
            await MainActor.run {
                self.isAuthenticated = false
                self.currentUser = nil
            }
            throw APIError.unauthorized
        }

        do {
            let decoded = try JSONDecoder().decode(T.self, from: data)
            return decoded
        } catch {
            throw APIError.decodingError(error)
        }
    }
}
