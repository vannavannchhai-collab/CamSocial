# CamSocial - បណ្តាញសង្គមខ្មែរ (Full Featured)

**Next.js 15 + Supabase + WebRTC (Video / Voice / Group / Screen Share)**

---

## មុខងារទាំងអស់

| មុខងារ | ស្ថានភាព |
|--------|----------|
| Authentication + Profile + Edit | ✅ |
| News Feed + Posts + Like + Comment | ✅ |
| Follow + Search + Verified Badge | ✅ |
| Messaging (Realtime) | ✅ |
| **Video Call (1-1)** | ✅ |
| **Voice Call Only** | ✅ |
| **Screen Share** | ✅ |
| **Group Video Call** | ✅ |
| Notifications (Realtime) | ✅ |
| Groups + Stories | ✅ |
| Dark Mode | ✅ |
| Mobile Setup Guide | ✅ |

---

## Calling Features

### 1. Video Call (1-1)
- ចុចប៊ូតុង **វីដេអូ** នៅ Profile ឬក្នុង Chat

### 2. Voice Call Only
- ចុចប៊ូតុង **សម្លេង** (ពណ៌ខៀវ)
- មិនប្រើកាមេរ៉ា

### 3. Screen Share
- នៅក្នុង Video Call → ចុច icon **Monitor**
- អាចចែករំលែកអេក្រង់ + បញ្ឈប់បាន

### 4. Group Video Call
- នៅក្នុង **Group Chat** → ចុច **Group Call**
- Mesh WebRTC (សមរម្យសម្រាប់ 2–6 នាក់)
- មាន Screen Share ផងដែរ

---

## Setup

```bash
cd camsocial
npm install
```

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

រត់ SQL:
1. `schema.sql`
2. `schema-v2.sql` (មាន video_calls + call_participants)

Realtime → បើក: `messages`, `notifications`, `video_calls`, `call_participants`

```bash
npm run dev
```

**ចំណាំ**: ត្រូវអនុញ្ញាត Camera + Microphone + Screen នៅ Browser  
ដំណើរការល្អបំផុតនៅ **HTTPS** ឬ localhost

---

## Blue Verified
```sql
UPDATE profiles SET is_verified = true WHERE username = 'your_username';
```

---

## Mobile
មើល `MOBILE_SETUP.md`

---

## License
MIT
