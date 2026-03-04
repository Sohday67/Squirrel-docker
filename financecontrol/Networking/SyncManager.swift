import Foundation
import CoreData

class SyncManager: ObservableObject {
    static let shared = SyncManager()

    @Published var isSyncing = false
    @Published var lastSyncDate: Date?
    @Published var syncError: String?

    private let apiClient = APIClient.shared
    private let dateFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    func syncAllData() async {
        guard apiClient.isAuthenticated else { return }

        await MainActor.run {
            self.isSyncing = true
            self.syncError = nil
        }

        do {
            try await syncCategories()
            try await syncSpendings()
            try await syncReturns()

            await MainActor.run {
                self.isSyncing = false
                self.lastSyncDate = Date()
                UserDefaults.standard.set(Date(), forKey: "lastSyncDate")
            }
        } catch {
            await MainActor.run {
                self.isSyncing = false
                self.syncError = error.localizedDescription
            }
        }
    }

    private func syncCategories() async throws {
        let context = DataManager.shared.context
        let fetchRequest: NSFetchRequest<CategoryEntity> = CategoryEntity.fetchRequest()

        let categories = try context.fetch(fetchRequest)
        let categoryDTOs = categories.compactMap { entity -> APIClient.CategoryDTO? in
            guard let id = entity.id?.uuidString, let name = entity.name else { return nil }
            return APIClient.CategoryDTO(
                id: id,
                name: name,
                color: entity.color,
                isShadowed: entity.isShadowed,
                isFavorite: entity.isFavorite
            )
        }

        let _ = try await apiClient.syncCategories(categoryDTOs)
    }

    private func syncSpendings() async throws {
        let context = DataManager.shared.context
        let fetchRequest: NSFetchRequest<SpendingEntity> = SpendingEntity.fetchRequest()

        let spendings = try context.fetch(fetchRequest)
        let spendingDTOs = spendings.compactMap { entity -> APIClient.SpendingDTO? in
            guard let id = entity.id?.uuidString,
                  let date = entity.date else { return nil }
            return APIClient.SpendingDTO(
                id: id,
                amount: entity.amount,
                amountUSD: entity.amountUSD,
                currency: entity.currency ?? "USD",
                categoryId: entity.category?.id?.uuidString,
                comment: entity.comment,
                place: entity.place,
                date: dateFormatter.string(from: date),
                timeZoneIdentifier: entity.timeZoneIdentifier
            )
        }

        let _ = try await apiClient.syncSpendings(spendingDTOs)
    }

    private func syncReturns() async throws {
        let context = DataManager.shared.context
        let fetchRequest: NSFetchRequest<ReturnEntity> = ReturnEntity.fetchRequest()

        let returns = try context.fetch(fetchRequest)
        let returnDTOs = returns.compactMap { entity -> APIClient.ReturnDTO? in
            guard let id = entity.id?.uuidString,
                  let date = entity.date else { return nil }
            return APIClient.ReturnDTO(
                id: id,
                spendingId: entity.spending?.id?.uuidString,
                amount: entity.amount,
                amountUSD: entity.amountUSD,
                currency: entity.currency ?? "USD",
                name: entity.name,
                date: dateFormatter.string(from: date)
            )
        }

        let _ = try await apiClient.syncReturns(returnDTOs)
    }
}
