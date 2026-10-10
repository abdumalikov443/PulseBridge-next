import { tr } from './i18n';
// CARDIOLOGY -> Cardiology, DOCTOR_REQUEST -> Doctor request (translated to the current language)
export const formatEnum = (value?: string | null): string => {
	if (!value) return '';
	const text = value.toLowerCase().replace(/_/g, ' ');
	return tr(text.charAt(0).toUpperCase() + text.slice(1));
};

// articles are written by doctors and clinics (not by patients or the ADMIN)
export const canWriteArticles = (memberType?: string | null): boolean =>
	memberType === 'DOCTOR' || memberType === 'CLINIC';
