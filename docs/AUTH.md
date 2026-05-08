# Google Sign-In (Expo - Web OAuth)

This project uses `expo-auth-session` (Google OAuth web flow) and `expo-secure-store` to persist tokens.

## Quick setup

1. Install packages (run in project root):
   - `expo install expo-auth-session expo-secure-store`

2. Create OAuth 2.0 Client IDs in Google Cloud Console:
   - Create a Web client ID (for the expo web flow / `expoClientId`).
   - Create Android/iOS client IDs if you plan to run on devices with full native flows.

3. Update `app.json` → `expo.extra.googleClientIds` with the client IDs:

```json
"extra": {
  "googleClientIds": {
    "expoClientId": "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    "androidClientId": "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    "iosClientId": "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com"
  }
}
```

4. Redirect URIs (if needed):
   - If using Expo Go or the `expo` proxy flow, `useProxy: true` handles most cases.
   - For standalone builds, add the redirect URI shown by `AuthSession.getRedirectUrl()` or `https://auth.expo.io/@your-username/your-app-slug` to the OAuth client.

## How it works (what's implemented)

- `app/providers/AuthProvider.tsx`:
  - Uses `Google.useAuthRequest()` to open the auth flow.
  - Fetches user info from Google (`https://www.googleapis.com/oauth2/v3/userinfo`).
  - Persists `auth:user` and `auth:token` in `expo-secure-store`.
  - Exposes `signIn`, `signOut`, `user`, and `loading` via `useAuth()` hook.

- Routes/screens:
  - `app/(auth)/splash.tsx` — checks for stored session and redirects to `/` or `/sign-in`.
  - `app/(auth)/sign-in.tsx` — Sign-in screen with a Google button that triggers `signIn()`.
  - `app/index.tsx` — Main dashboard; redirects to `/splash` if user is not authenticated.

## Next steps / Notes

- Replace client ID placeholders with your google client IDs.
- For production/staged apps, follow Google requirements (Android SHA-1, iOS Bundle ID / reversed client ID, redirect URIs).
- If you want native Google sign-in UX or additional token management (refresh tokens), consider `@react-native-google-signin/google-signin` and prebuilding.
