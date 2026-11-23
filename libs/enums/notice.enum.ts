// FAQ answers and platform notices, managed by the admin
export enum NoticeCategory {
	FAQ = 'FAQ',
	NOTICE = 'NOTICE',
}

// HOLD = draft, hidden from users
export enum NoticeStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}

// FAQ tabs (only for FAQ)
export enum FaqTopic {
	ACCOUNT = 'ACCOUNT',
	APPOINTMENT = 'APPOINTMENT',
	DOCTOR = 'DOCTOR',
	CLINIC = 'CLINIC',
	OTHER = 'OTHER',
}
