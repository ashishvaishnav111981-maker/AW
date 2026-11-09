# AW

## GitHub में क्या जाएगा
इस फोल्डर की सारी फाइलें और फोल्डर (`.github` समेत) repository `aw` के main branch पर।

## स्टेप्स
1. GitHub पर repository `aw` बनाएँ (Public)।
2. Settings → Pages → Source: "GitHub Actions" चुनें।
3. फाइलें push करें।
4. Actions टैब में "Deploy web to GitHub Pages" और "Build Android APK" पूरे होने दें (पहले Deploy)।
5. "Build Android APK" के Artifacts से `AW-debug-apk` डाउनलोड करके फोन में इंस्टॉल करें।

## अपडेट कैसे होते हैं
- स्क्रीन, फीचर और डिज़ाइन: GitHub पर बदलाव push करें। ऐप खुलते ही या "अपडेट" बटन दबाने पर नया वर्ज़न लोड होता है।
- आइकन, ऐप का नाम, परमिशन जैसे native बदलाव: नई APK बनानी होगी।
