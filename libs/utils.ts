// CARDIOLOGY -> Cardiology, DOCTOR_REQUEST -> Doctor request
export const formatEnum = (value?: string | null): string => {
	if (!value) return '';
	const text = value.toLowerCase().replace(/_/g, ' ');
	return text.charAt(0).toUpperCase() + text.slice(1);
};
