# CamSocial Mobile App Setup (React Native + Expo)

អ្នកអាចប្រើ **Backend ដូចគ្នា** (Supabase) សម្រាប់ Mobile App។

---

## 1. បង្កើត Expo Project

```bash
npx create-expo-app@latest CamSocialMobile --template blank-typescript
cd CamSocialMobile
```

## 2. Install Dependencies

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
npx expo install expo-image-picker expo-secure-store
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

## 3. Supabase Client (lib/supabase.ts)

```typescript
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

## 4. រចនាសម្ព័ន្ធណែនាំ

```
CamSocialMobile/
├── app/                    # Expo Router (ឬ React Navigation)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── feed.tsx
│   │   ├── search.tsx
│   │   ├── messages.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── components/
│   ├── PostCard.tsx
│   ├── CreatePost.tsx
│   └── ...
├── lib/
│   └── supabase.ts
└── types/
    └── database.ts         # ចម្លងពី Web project
```

## 5. Navigation (Bottom Tabs)

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Home, Search, MessageCircle, Bell, User } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="feed" options={{ title: "Feed", tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: ({ color }) => <Search color={color} size={22} /> }} />
      <Tabs.Screen name="messages" options={{ title: "Chat", tabBarIcon: ({ color }) => <MessageCircle color={color} size={22} /> }} />
      <Tabs.Screen name="notifications" options={{ title: "Alerts", tabBarIcon: ({ color }) => <Bell color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
```

## 6. Realtime នៅ Mobile

```typescript
useEffect(() => {
  const channel = supabase
    .channel("messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      // Update messages state
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

## 7. Run

```bash
npx expo start
```

- ស្កេន QR code ជាមួយ Expo Go (Android/iOS)
- ឬ `npx expo run:android` / `npx expo run:ios`

## 8. Build Production

```bash
npx eas build --platform android
npx eas build --platform ios
```

---

**ចំណាំ**:  
- ប្រើ Database + Auth + Storage ដូចគ្នាពី Web
- Types អាចចម្លងពី `types/database.ts`
- UI អាចប្រើ NativeWind (Tailwind for RN) ប្រសិនបើចង់
