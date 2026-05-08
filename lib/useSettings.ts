import { useAuth } from "../context/AuthContext";
import { settingsService, UpdateSettingsInput } from "./settingsService";

/**
 * Hook to manage user settings in components
 * Automatically scopes all operations to the logged-in user
 */
export function useSettings() {
  const { user } = useAuth();

  if (!user) {
    throw new Error("useSettings must be used within an authenticated context");
  }

  return {
    // Read
    getUserSettings: () => settingsService.getUserSettings(user.id),

    // Update - General
    updateUserSettings: (updates: UpdateSettingsInput) => settingsService.updateUserSettings(user.id, updates),

    // Update - Specific Settings
    setHoursPerDay: (hours: number) => settingsService.setHoursPerDay(user.id, hours),
    setWorkingDays: (workdays: number[]) => settingsService.setWorkingDays(user.id, workdays),
    setTheme: (theme: "light" | "dark") => settingsService.setTheme(user.id, theme),
    setNotificationsEnabled: (enabled: boolean) => settingsService.setNotificationsEnabled(user.id, enabled),
    setAutoTrackEnabled: (enabled: boolean) => settingsService.setAutoTrackEnabled(user.id, enabled),
    setPomodoro: (workInterval: number, breakDuration: number) => settingsService.setPomodoro(user.id, workInterval, breakDuration),
    setReminderFrequency: (frequency: "daily" | "weekly" | "never") => settingsService.setReminderFrequency(user.id, frequency),

    // Calculations
    calculateWorkingHours: (startDate: Date, endDate: Date) => settingsService.calculateWorkingHours(user.id, startDate, endDate),
    calculateCompletionDate: (estimatedHours: number, startDate?: Date) => settingsService.calculateCompletionDate(user.id, estimatedHours, startDate),

    // Recalculation
    recalculateOrderTimelines: () => settingsService.recalculateOrderTimelines(user.id),

    // Stats & Suggestions
    suggestHoursPerDay: () => settingsService.suggestHoursPerDay(user.id),
    getWorkdaysReadable: (workdaysString: string) => settingsService.getWorkdaysReadable(workdaysString),

    // Validation
    validateSettings: (updates: UpdateSettingsInput) => settingsService.validateSettings(user.id, updates),
  };
}
