import { getJwtToken } from './auth';
import { REACT_APP_API_URL } from './config';

// REST download (GraphQL does not serve files): GET /appointment/:id/pdf with the login token
export const downloadAppointmentPdf = async (appointmentId: string): Promise<void> => {
	const response = await fetch(`${REACT_APP_API_URL}/appointment/${appointmentId}/pdf`, {
		headers: { Authorization: `Bearer ${getJwtToken()}` },
	});
	if (!response.ok) {
		// Nest sends { message } for errors (cancelled appointment, no access, ...)
		const body = await response.json().catch(() => null);
		throw new Error(body?.message ?? 'The document could not be downloaded.');
	}
	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `appointment-${appointmentId}.pdf`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};
