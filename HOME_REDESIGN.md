# Home redesign plan (Clinical Discovery)

Layout taken from the two Stitch drafts (Oct 2026), colors stay Soft Care (`scss/pb/_tokens.scss`).
Demo page: `design/home-demo.html` (open in a browser), also published at https://claude.ai/artifact/NpxajVSzJDEbKz1crS588f (private).
Backend API does not change; everything below uses existing operations.

## Decisions

- Header layout as in the draft: logo with "Clinical discovery" subtitle, pill nav, Emergency 119 chip, "Sign In / Book Consult" button.
- No rating, no consultation price, no Profile button on doctor cards (the whole card opens the profile).
- "Next available" on doctor cards is the first free slot from getDoctorAvailability (static until the backend added it).
- Doctor and clinic cards get like + view chips (`ActionChips`). When liked, only the heart icon turns red; the count and chip background stay the same.
- Doctor card: photo on the left, name and specialty on its right.
- Clinic tags = specialties of that clinic's doctors. No rating on clinics.
- Clinic "Directions" button stays as it is (Google Maps search by address).

## Sections and data

| Section | Source | Notes |
| --- | --- | --- |
| Header | `PbHeader.tsx` | Nav: Find Doctors `/doctor`, Clinics & Networks `/clinic`, Telehealth, Health Stories `/community`. Emergency chip is static text (119), no link. Login button text: "Sign In / Book Consult". |
| Hero left | static + i18n | Headline, lede, CTA buttons (Find a Doctor, Explore Clinics). |
| Popular chips | static | Specialty chips, open `/doctor` filtered by that specialty. No search bar in the hero. |
| Hero card "Your care" | `GET_MY_APPOINTMENTS` + `GET_MEMBER_FOLLOWINGS` | Signed in: next upcoming visit (`appointmentDate` ASC, status not cancelled/completed) and the first followed doctor with a Book button. Guest: show a login prompt card instead. |
| Stats row | `GET_DOCTORS`, `GET_CLINICS`, `GET_ARTICLES` | `limit: 1`, read `metaCounter.total`. Replaces the draft's fake numbers (98% positive, 12,000+ consultations, ~15 min wait). |
| Specialties grid | `GET_DOCTORS` per specialty | 6 enum values (`DoctorSpecialty`). Count = `metaCounter.total` with `specialtyList: [value]`. 6 small queries; cache with `cache-first`. Click -> `/doctor?input=...`. |
| Featured doctors | `GET_DOCTORS` | `sort: 'doctorRank'`, `limit: 4`. Card: initials/photo, name, specialty, clinic, experience, static "Next available", like/view chips, Book Visit -> `/booking?doctorId=`. |
| Clinics | `GET_CLINICS` + `GET_DOCTORS` | `sort: 'clinicRank'`, `limit: 3`. Tags: one `GET_DOCTORS` with `search.clinicId`, unique `specialty` values (max 3). Cover: `clinicImage` or a gradient by index; badge from `clinicType`. Footer: like/view chips + Directions. |
| Health stories | `GET_ARTICLES` | `sort: 'articleLikes'` or `createdAt`, `limit: 2`. Author, Doctor badge (`memberType`), date, read time = words / 200 (min 1), like/comment/view chips. No bookmark. |
| Footer | `PbFooter.tsx` | Keep current footer. |

## Not in the API (do not fake)

Rating, review score, consultation price, real availability slots, online status dot, telehealth/video calls, wait time, satisfaction %, bookmarks, clinic district, "medically reviewed by", location and date filters in search.

Telehealth stays in the header only because the draft has it; it needs a page or a "coming soon" state before release.

## Work list

1. Header: subtitle, Emergency chip, new nav labels, button text (`PbHeader.tsx`, `_layout.scss`).
2. Home hero: split layout (no search bar), specialty chips, "Your care" card (`HomeHero.tsx`, `_home.scss`).
3. Stats row and specialties grid (new `HomeStats.tsx`, `HomeSpecialties.tsx`).
4. `DoctorCard`: photo left with name on the right, remove Profile button, add static "Next available", keep like/view, full-width Book Visit.
5. `ClinicCard`: cover with type badge, address + doctors count, specialty tags, like/view, Directions.
6. Home articles: `PostCard` variant with read time and "Read article" link.
7. i18n keys for all new text (en / kr / ru).
8. Check phone width (header burger, search stacks to one column, grids to one column).
9. `npx tsc --noEmit`, `npm run build`.

## Status (2026-10-07)

Done: items 1-7 and 9. Phone width checked on the home page (no horizontal scroll).

Changes from the plan:
- "Your care" card shows the top ranked doctor (not the first followed one): a following only gives the member id, and booking needs the doctor id.
- Follow was removed from doctor and clinic list cards; it stays on the detail pages (Follow button under the main action).
- Telehealth in the header opens a "coming soon" message.
- i18n config: `keySeparator` and `nsSeparator` are off, because the keys are English sentences with dots and colons.
