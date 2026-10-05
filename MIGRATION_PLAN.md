# Frontend migratsiya rejasi: Nestar (ko'chmas mulk) → PulseBridge (sog'liqni saqlash)

> **Qoida:** backend API'ga (resolver, DTO, enum, schema) **hech qanday o'zgartirish kiritilmaydi**. Frontend backendning hozirgi kontraktiga moslashtiriladi.
> **Manba:** `../pulsebridge` (branch `modification`, lokal ishchi nusxa) — `apps/pulsebridge-api/src/components/*/*.resolver.ts` va `libs/dto/*`. Nomlar shu fayllardan olingan.
>
> **Holat (2026-10-06):** 1–8 bosqichlar bajarildi. Barcha 57 ta GraphQL hujjat backend sxemasiga (commit `543958d`) qarshi validatsiyadan o'tdi, `tsc` va `next build` toza. Qolganlar: real backend bilan §9 tekshiruv ro'yxati, Nestar logo/banner rasmlarini almashtirish, mobil ko'rinishlar.

---

## 0. Tayyorgarlik

| # | Ish | Natija |
|---|---|---|
| 0.1 | Yangi branch: `feat/pulsebridge-client` | `modification` toza qoladi |
| 0.2 | Backendni lokal ishga tushirish (`npm run start:dev`), Playground'dan sxemani ko'rish | Har bir operatsiyani qo'lda tekshirish imkoni |
| 0.3 | `.env.development` dagi `REACT_APP_API_URL / _GRAPHQL_URL / _WS` backend portiga mosligini tekshirish | — |
| 0.4 | `npx tsc --noEmit` ni asosiy tekshiruv sifatida ishlatish (har bosqich oxirida) | Nom o'zgarishlarini kompilyator ushlaydi |

---

## 1. Tiplar va enumlar (`libs/enums`, `libs/types`)

### 1.1 Enumlar

| Fayl | Hozir | Bo'lishi kerak |
|---|---|---|
| `member.enum.ts` | `MemberType { USER, AGENT, ADMIN }`, `MemberAuthType` | `MemberType { PATIENT, DOCTOR, CLINIC, ADMIN }`; `MemberAuthType` o'chiriladi |
| `property.enum.ts` | `PropertyType`, `PropertyStatus`, `PropertyLocation` | **o'chiriladi** → `clinic.enum.ts`: `ClinicStatus { ACTIVE, PAUSE, DELETE }`, `ClinicType { PRIVATE, PUBLIC }` |
| — | — | **yangi** `doctor.enum.ts`: `DoctorSpecialty { CARDIOLOGY, DERMATOLOGY, PEDIATRICS, NEUROLOGY, DENTISTRY, GENERAL }`, `JoinRequestStatus { PENDING, APPROVED, REJECTED }` |
| — | — | **yangi** `appointment.enum.ts`: `AppointmentStatus { CONFIRMED, COMPLETED, CANCELLED }` |
| `board-article.enum.ts` | `BoardArticleCategory`, `BoardArticleStatus` | `article.enum.ts`: faqat `ArticleStatus { ACTIVE, DELETE }` (kategoriya backendda **yo'q**) |
| `like.enum.ts`, `view.enum.ts`, `comment.enum.ts` | `MEMBER / PROPERTY / ARTICLE` | `DOCTOR / CLINIC / ARTICLE` |
| `notification.enum.ts` | `LIKE, COMMENT`; group `MEMBER, ARTICLE, PROPERTY` | type `LIKE, COMMENT, FOLLOW, APPOINTMENT, DOCTOR_REQUEST`; group `MEMBER, DOCTOR, CLINIC, ARTICLE` |
| `notice.enum.ts` | o'zgarmaydi | (backendda Notice API yo'q — §7) |

### 1.2 Tiplar

| Hozir | Bo'lishi kerak |
|---|---|
| `types/property/*` | **o'chiriladi** → `types/clinic/clinic.ts` (`Clinic`, `Clinics`), `clinic.input.ts` (`ClinicInput`, `ClinicsInquiry`, `AllClinicsInquiry`), `clinic.update.ts` |
| — | **yangi** `types/doctor/*`: `Doctor`, `Doctors`, `DoctorProfileInput`, `DoctorsInquiry`, `DoctorUpdate`, `ClinicJoinRequest(s)`, `JoinRequestUpdate` |
| — | **yangi** `types/appointment/*`: `Appointment(s)`, `AppointmentInput`, `AppointmentsInquiry`, `AppointmentUpdate` |
| — | **yangi** `types/notification/*`: `Notification(s)`, `NotificationsInquiry` |
| `types/board-article/*` | `types/article/*`: `Article(s)`, `ArticleInput`, `ArticlesInquiry`, `AllArticlesInquiry`, `ArticleUpdate` |
| `types/member/member.ts` | `memberProperties`, `memberAuthType`, `memberWarnings`, `memberBlocks` **o'chiriladi**; `memberFollowers`, `memberFollowings`, `memberComments` qo'shiladi |
| `types/member/member.input.ts` | `MemberInput` ga `memberType` (majburiy), `doctorProfile?`, `clinicProfile?` |
| `types/customJwtPayload.ts` + `apollo/store.ts` (`userVar`) + `libs/auth` (`updateUserInfo`, `deleteUserInfo`) | Member bilan bir xil maydonlar to'plamiga keltiriladi |

Muhim maydon nomlari:
- **Clinic:** `clinicStatus, clinicType, clinicName, clinicAddress, clinicDesc, clinicImage` (bitta rasm, massiv emas), `clinicViews, clinicLikes, clinicComments, clinicDoctors, clinicRank, memberId, meLiked, memberData`
- **Doctor:** `memberId, clinicId (null bo'lishi mumkin), specialty, experience, doctorViews, doctorLikes, doctorComments, doctorRank, meLiked, memberData, clinicData`. Doctor'da ism yo'q — ism/rasm `memberData.memberFullName / memberNick / memberImage` dan olinadi
- **Appointment:** `appointmentDate (Date), appointmentTime ("HH:mm"), appointmentStatus, appointmentReason, memberId, doctorId, clinicId, memberData, doctorData{memberData}, clinicData`
- **Article:** `articleStatus, articleTitle (3–50), articleContent (3–250!), articleImage, articleViews, articleLikes, articleComments, memberId, meLiked, memberData`

### 1.3 `libs/config.ts`
- `availableOptions` (`propertyBarter`, `propertyRent`), `propertyYears`, `propertySquare`, `topPropertyRank` → o'chiriladi.
- Sort kalitlari (backend `IsIn` bilan tekshiradi, boshqasi xato beradi):
  - clinic: `createdAt, updatedAt, clinicLikes, clinicViews, clinicRank, clinicDoctors`
  - doctor: `createdAt, updatedAt, doctorLikes, doctorViews, doctorRank, experience`
  - article: `createdAt, updatedAt, articleLikes, articleViews`
  - appointment: `createdAt, updatedAt, appointmentDate`
  - member: `createdAt, updatedAt, memberLikes, memberViews`
  - comment: `createdAt, updatedAt`

---

## 2. Apollo hujjatlari (`apollo/user/*`, `apollo/admin/*`)

> Argument nomlari muhim: backend `@Args('clinicId')` deb kutsa, so'rovda ham `getClinic(clinicId: $input)` bo'lishi shart.

### 2.1 Query'lar

| Hozir | Yangi | Argument | Guard |
|---|---|---|---|
| `getProperty(propertyId)` | `getClinic` | `clinicId: String!` | Without |
| `getProperties(input: PropertiesInquiry)` | `getClinics` | `input: ClinicsInquiry` (`search: { clinicType?, text? }`) | Without |
| `getAgents(input: AgentsInquiry)` | `getDoctors` | `input: DoctorsInquiry` (`search: { clinicId?, specialtyList?, text? }`) | Without |
| `getAgentProperties` | — o'chiriladi | klinika shifokorlari: `getDoctors({ search: { clinicId } })` | |
| — | `getDoctor` | `doctorId: String!` | Without |
| `getFavorites(input)` | `getFavoriteClinics` + `getFavoriteDoctors` | `input: OrdinaryInquiry` | Auth |
| `getVisited(input)` | `getVisitedClinics` + `getVisitedDoctors` | `input: OrdinaryInquiry` | Auth |
| `getBoardArticle(articleId)` | `getArticle` | `articleId: String!` | Without |
| `getBoardArticles(input)` | `getArticles` | `input: ArticlesInquiry` (`search: { text?, memberId? }`) | Without |
| `getMember(memberId)` | o'zgarmaydi | maydonlar to'plami yangilanadi (§1.2) | Without |
| `getComments`, `getMemberFollowers`, `getMemberFollowings` | o'zgarmaydi | | |
| — | **yangi** `getMyClinic` | — | CLINIC |
| — | **yangi** `getMyDoctorProfile` | — | Auth (DOCTOR) |
| — | **yangi** `getMyAppointments` / `getDoctorAppointments` / `getClinicAppointments` | `input: AppointmentsInquiry` (`search: { appointmentStatus?, doctorId? }`) | Auth / Auth / CLINIC |
| — | **yangi** `getMyJoinRequests` / `getClinicJoinRequests` | `input: OrdinaryInquiry` | DOCTOR / CLINIC |
| — | **yangi** `getNotifications` | `input: NotificationsInquiry` (`search: { notificationStatus? }`) | Auth |

### 2.2 Mutation'lar

| Hozir | Yangi | Argument | Guard |
|---|---|---|---|
| `signup(input)` | o'zgarmaydi | `memberType` + `doctorProfile` / `clinicProfile` (§3) | — |
| `login(input)` | o'zgarmaydi | | — |
| `updateMember(input)` | o'zgarmaydi | `memberType`/`memberStatus` yubormaslik | Auth |
| `createProperty` | — o'chiriladi | klinika signup paytida yaratiladi | |
| `updateProperty` | `updateClinic` | `input: ClinicUpdate` | CLINIC |
| `likeTargetProperty(propertyId)` | `likeTargetClinic` / `likeTargetDoctor` | `clinicId` / `doctorId` | Auth |
| `likeTargetMember(memberId)` | — **backendda yo'q**, UI'dan olib tashlanadi | | |
| `createBoardArticle` / `updateBoardArticle` / `likeTargetBoardArticle(articleId)` | `createArticle` / `updateArticle` / `likeTargetArticle(articleId)` | | Auth |
| `createComment`, `updateComment` | o'zgarmaydi | `commentGroup`: `DOCTOR / CLINIC / ARTICLE` | Auth |
| `subscribe`, `unsubscribe` | o'zgarmaydi | | Auth |
| `imageUploader` / `imagesUploader` | o'zgarmaydi | `target` faqat `member`, `clinic`, `article` (`'property'` → xato) | Auth |
| — | **yangi** `updateDoctor` | `input: DoctorUpdate` | Auth (DOCTOR) |
| — | **yangi** `requestJoinClinic(clinicId)`, `cancelJoinRequest(requestId)` | | DOCTOR |
| — | **yangi** `respondJoinRequest(input: JoinRequestUpdate)`, `removeDoctor(doctorId)` | | CLINIC |
| — | **yangi** `createAppointment(input: AppointmentInput)` | `doctorId, appointmentDate, appointmentTime "HH:mm", appointmentReason?` | PATIENT |
| — | **yangi** `updateAppointment(input: AppointmentUpdate)` | `appointmentStatus`: `COMPLETED` yoki `CANCELLED` | Auth |
| — | **yangi** `readNotification(notificationId)`, `readAllNotifications` | | Auth |

### 2.3 Admin

| Hozir | Yangi |
|---|---|
| `getAllMembersByAdmin`, `updateMemberByAdmin` | o'zgarmaydi (filter: `memberType` yangi qiymatlar) |
| `getAllPropertiesByAdmin` | `getAllClinicsByAdmin(input: AllClinicsInquiry)` |
| `updatePropertyByAdmin` | `updateClinicByAdmin(input: ClinicUpdate)` |
| `removePropertyByAdmin(propertyId)` | `removeClinicByAdmin(clinicId)` |
| `getAllBoardArticlesByAdmin` / `updateBoardArticleByAdmin` / `removeBoardArticleByAdmin` | `getAllArticlesByAdmin` / `updateArticleByAdmin` / `removeArticleByAdmin(articleId)` |
| `removeCommentByAdmin(commentId)` | o'zgarmaydi; **yangi** `updateCommentByAdmin(input)` |
| — | **yangi** `removeDoctorByAdmin(doctorId)`, `getAllAppointmentsByAdmin(input)` |

---

## 3. Autentifikatsiya va ro'yxatdan o'tish

| Fayl | Ish |
|---|---|
| `libs/auth/index.ts` | `signUp(nick, password, phone, type)` → `signUp(input: MemberInput)` ko'rinishiga; `doctorProfile` / `clinicProfile` ni uzatish. Signup va login selection set'ida `accessToken` bo'lishi shart |
| `libs/auth/index.ts` | Xato matnlari backend `Message` enum'iga moslanadi: `"Wrong password, try again please!"`, `"You have been blocked!"`, `"No member with that membernick!"` (hozirgi `"Definer: ..."` matnlari endi kelmaydi) |
| `pages/account/join.tsx` | Rol tanlash: **PATIENT / DOCTOR / CLINIC** (ADMIN yo'q). DOCTOR → `specialty` + `experience`. CLINIC → `clinicType, clinicName (3–100), clinicAddress (3–100), clinicDesc (5–500)`. Faqat rolga mos profil yuboriladi, aks holda `PROFILE_MISMATCH` |
| Validatsiya | `memberNick` 3–12, `memberPassword` 5–12 — frontendda ham tekshirish |
| Eslatma | JWT secret o'zgargani uchun eski tokenlar ishlamaydi → 401/xato bo'lsa `logOut()` qilish |

---

## 4. Sahifa va komponentlar

### 4.1 Marshrutlar

| Hozir | Yangi | Ma'lumot manbai |
|---|---|---|
| `/property` | `/clinic` | `getClinics` |
| `/property/detail?id=` | `/clinic/detail?id=` | `getClinic`, `getDoctors({clinicId})`, `getComments` (`CLINIC`) |
| `/agent` | `/doctor` | `getDoctors` |
| `/agent/detail?agentId=` | `/doctor/detail?id=` | `getDoctor`, `getComments` (`DOCTOR`), **Book appointment** |
| `/community`, `/community/detail` | o'zgarmaydi | `getArticles`, `getArticle` |
| `/mypage`, `/member` | o'zgarmaydi (ichki bo'limlar rolga qarab) | §4.3 |
| `/cs` | o'zgarmaydi (statik) | §7 |
| `/_admin/properties` | `/_admin/clinics` | §5 |

Eski URL'lar uchun `next.config.js` da `redirects()` (`/property*` → `/clinic*`, `/agent*` → `/doctor*`).

### 4.2 Komponentlar

| Hozir | Yangi | Izoh |
|---|---|---|
| `homepage/TopProperties`, `TopPropertyCard` | `TopClinics`, `TopClinicCard` | `getClinics` sort `clinicRank` |
| `homepage/TrendProperties`, `TrendPropertyCard` | `TrendClinics` | sort `clinicLikes` |
| `homepage/PopularProperties`, `PopularPropertyCard` | `PopularDoctors` | `getDoctors` sort `doctorViews` |
| `homepage/TopAgents`, `TopAgentCard` | `TopDoctors`, `TopDoctorCard` | sort `doctorRank` |
| `homepage/CommunityBoards`, `CommunityCard` | o'zgarmaydi | kategoriyalar o'rniga "Latest" (`createdAt`) va "Popular" (`articleLikes`) |
| `homepage/HeaderFilter` | Qidiruv: matn + `ClinicType` yoki `DoctorSpecialty` | joylashuv/xona/maydon filtrlari olib tashlanadi |
| `homepage/Events`, `Advertisement` | Kontent sog'liq mavzusiga | API yo'q, statik |
| `property/Filter` | `clinic/ClinicFilter` + `doctor/DoctorFilter` | clinic: `clinicType, text`; doctor: `specialtyList, text` |
| `property/PropertyCard`, `common/PropertyBigCard` | `clinic/ClinicCard`, `common/ClinicBigCard` | `clinicImage` bitta rasm |
| `common/AgentCard` | `common/DoctorCard` | ism/rasm `memberData`, klinika `clinicData.clinicName` |
| `property/Review`, `agent/ReviewCard` | `common/ReviewCard` | `commentGroup`: `CLINIC` yoki `DOCTOR` |
| **yangi** | `doctor/BookAppointment` (modal) | sana + vaqt (`HH:mm`) + sabab → `createAppointment`; faqat PATIENT ga ko'rinadi |
| `Top.tsx` bildirishnoma ikonkasi | `NotificationMenu` | `getNotifications` (`pollInterval` ~30s, backendda GraphQL subscription yo'q), badge `WAIT` soni, `readNotification`, `readAllNotifications` |

### 4.3 MyPage — rolga qarab menyu (`mypage/MyMenu.tsx`)

| Bo'lim | PATIENT | DOCTOR | CLINIC |
|---|---|---|---|
| Profil (`MyProfile`) | ✓ | ✓ + `updateDoctor` (specialty, experience) | ✓ |
| **Qabullarim** (`MyAppointments`, yangi) | `getMyAppointments`, bekor qilish | `getDoctorAppointments`, yakunlash/bekor qilish | `getClinicAppointments` (doctor bo'yicha filtr), yakunlash/bekor qilish |
| **Klinikam** (`MyClinic`, yangi; `AddNewProperty` o'rnida) | — | — | `getMyClinic`, `updateClinic`, rasm `target: 'clinic'` |
| **Shifokorlar** (`ClinicDoctors`, yangi; `MyProperties` o'rnida) | — | — | `getDoctors({clinicId})`, `removeDoctor` |
| **Qo'shilish so'rovlari** (`JoinRequests`, yangi) | — | `getMyJoinRequests`, `requestJoinClinic`, `cancelJoinRequest` | `getClinicJoinRequests`, `respondJoinRequest` |
| Sevimlilar (`MyFavorites`) | clinic + doctor tablar | ✓ | ✓ |
| Yaqinda ko'rilganlar (`RecentlyVisited`) | clinic + doctor tablar | ✓ | ✓ |
| Maqolalarim / Maqola yozish | ✓ | ✓ | ✓ |
| Followers / Followings | ✓ | ✓ | ✓ |

`member/MemberProperties` → olib tashlanadi (yoki a'zo DOCTOR/CLINIC bo'lsa uning shifokor/klinika kartasi ko'rsatiladi).

### 4.4 Biznes qoidalari (UI'da hisobga olish)
- Klinikaga qo'shilmagan shifokor (`clinicId: null`) ro'yxatlarda chiqmaydi, unga yozilib va like bosib bo'lmaydi. DOCTOR o'z kabinetida "klinikaga qo'shiling" ogohlantirishini ko'rishi kerak.
- Qabul: o'tmishdagi vaqt (`PAST_APPOINTMENT`), band slot (`SLOT_TAKEN`), o'ziga yozilish (`SELF_APPOINTMENT_DENIED`) — xatolar `errorLink` orqali sweetAlert bilan chiqadi; formada ham sana/vaqt validatsiyasi.
- Bemor faqat bekor qiladi; shifokor/klinika egasi yakunlaydi yoki bekor qiladi. Tugmalar shunga qarab ko'rsatiladi.
- Klinika egasi bitta klinikaga ega; DOCTOR bir vaqtda faqat bitta kutilayotgan so'rovga ega bo'lishi mumkin (`DOCTOR_REQUEST_EXISTS`).

---

## 5. Admin panel (`pages/_admin`, `libs/components/admin`)

| Hozir | Yangi |
|---|---|
| `users/MemberList` | `memberType` filtri: PATIENT / DOCTOR / CLINIC / ADMIN; status o'zgartirish |
| `properties/PropertyList` | `clinics/ClinicList`: `getAllClinicsByAdmin`, status (ACTIVE/PAUSE/DELETE), `removeClinicByAdmin` |
| — | **yangi** `doctors/DoctorList`: `getDoctors` + `removeDoctorByAdmin` (admin uchun alohida "barcha shifokorlar" query yo'q — §7) |
| — | **yangi** `appointments/AppointmentList`: `getAllAppointmentsByAdmin` |
| `community/CommunityArticleList` | `getAllArticlesByAdmin`, `updateArticleByAdmin`, `removeArticleByAdmin`; kategoriya ustuni olib tashlanadi |
| `cs/*` | statik qoladi (§7) |
| `AdminMenuList` | Menyular yangilanadi |

---

## 6. Branding, i18n, real-time

- `package.json` `name`: `nestar-next` → `pulsebridge-next`; logo, favicon, `<title>`, Footer, About sahifasi.
- `public/locales/{en,kr,ru}/common.json`: Property → Clinic, Agent → Doctor, Price → olib tashlanadi, yangi kalitlar (Appointment, Book, Specialty, Experience, Join request, Notifications).
- Ko'chmas mulk rasmlari (`public/img/banner/cities`, `types`, `property/*`) → sog'liq mavzusidagi rasmlar bilan almashtiriladi.
- **WebSocket chat:** backend protokoli o'zgarmagan (`info`, `getMessages`, `message`, `?token=`). `Chat.tsx` ishlayveradi; faqat `reconnect` va `memberData` maydonlarini tekshirish.

---

## 7. Backendda yo'q narsalar (API o'zgartirilmaydi — frontendda hal qilinadi)

| Muammo | Frontend yechimi | Kelajakda backendda |
|---|---|---|
| `articleContent` maksimal **250 belgi**; Toast UI HTML tez oshib ketadi | Editor o'rniga oddiy textarea + hisoblagich, yoki markdown'ni 250 gacha cheklash | Limitni oshirish |
| Maqola kategoriyalari yo'q | Kategoriya tablar olib tashlanadi | `articleCategory` qo'shish |
| `likeTargetMember` yo'q | Member like tugmasi olib tashlanadi | — |
| Notice / FAQ / Inquiry API yo'q | `/cs` statik kontent | Notice moduli |
| Admin uchun barcha shifokorlar query'si yo'q (`getDoctors` faqat klinikasi borlarni beradi) | `getDoctors` bilan cheklangan ro'yxat | `getAllDoctorsByAdmin` |
| Shifokor ish jadvali yo'q | Vaqt erkin kiritiladi, band bo'lsa `SLOT_TAKEN` | DoctorSchedule moduli |
| GraphQL subscription yo'q | Bildirishnomalar uchun `pollInterval` | Notification push (WS) |

---

## 8. Bajarish tartibi

| Bosqich | Ish | Tayyor bo'lgan payt |
|---|---|---|
| 1 | §1 tiplar/enumlar + §2 Apollo hujjatlari | `tsc --noEmit` xatolari faqat komponentlarda qoladi |
| 2 | §3 auth/signup | Uchala rol bilan signup va login ishlaydi |
| 3 | Clinic/Doctor ro'yxat va detail sahifalari, Home | Ro'yxat, filtr, like, view, izoh ishlaydi |
| 4 | Community (`Article`) | Yozish, tahrirlash, like, izoh |
| 5 | MyPage rolga qarab + appointment + join request | §9 dagi oqimlar o'tadi |
| 6 | Bildirishnomalar | Badge va o'qilgan qilish ishlaydi |
| 7 | Admin panel | Barcha admin amallari ishlaydi |
| 8 | Branding, i18n, rasmlar, redirectlar | `property`/`agent`/`nestar` qidiruvi bo'sh |
| 9 | Regressiya testi (§9) | Checklist to'liq |

Har bosqich alohida commit; `npx tsc --noEmit` va `npm run build` o'tishi shart.

---

## 9. Tekshiruv ro'yxati

- [ ] PATIENT signup → login → klinika/shifokor ko'rish → like → izoh → qabulga yozilish → bekor qilish
- [ ] CLINIC signup (clinicProfile bilan) → `getMyClinic` → rasm yuklash → klinikani tahrirlash
- [ ] DOCTOR signup (doctorProfile bilan) → klinikaga so'rov → CLINIC tasdiqlaydi → shifokor ro'yxatda chiqadi
- [ ] DOCTOR/CLINIC qabulni yakunlaydi; band slotga ikkinchi yozilish rad etiladi
- [ ] Bildirishnomalar: like, comment, follow, appointment, doctor request
- [ ] Follow / unfollow, member page
- [ ] Maqola yozish (250 belgi chegarasi), like, izoh
- [ ] Admin: a'zolar, klinikalar, shifokorlar, maqolalar, izohlar, qabullar
- [ ] WebSocket chat: login/guest, onlayn soni, xabarlar
- [ ] i18n: en / kr / ru; mobil ko'rinish
