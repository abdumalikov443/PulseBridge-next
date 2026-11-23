import Swal from 'sweetalert2';
import 'animate.css';
import { Messages } from './config';
import { showToast } from './toast';
import { tr } from './i18n';

// short messages are toasts (top right, close by themselves); questions stay as dialogs

export const sweetErrorHandling = async (err: any) => {
	showToast('error', err?.message || Messages.error1);
};

export const sweetTopSuccessAlert = async (msg: string, duration: number = 2000) => {
	showToast('success', msg.replace('Definer: ', ''), undefined, Math.max(duration, 2500));
};

export const sweetContactAlert = async (msg: string, duration: number = 10000) => {
	showToast('info', msg, undefined, duration);
};

// confirmation dialog in the Soft Care colors
const dialog = Swal.mixin({
	showCancelButton: true,
	showConfirmButton: true,
	reverseButtons: true,
	buttonsStyling: false,
	customClass: {
		popup: 'pb-dialog',
		confirmButton: 'pb-btn pb-btn--primary pb-btn--sm',
		cancelButton: 'pb-btn pb-btn--light pb-btn--sm',
		actions: 'pb-dialog__actions',
	},
});

export const sweetConfirmAlert = async (msg: string): Promise<boolean> => {
	const response = await dialog.fire({ text: tr(msg), confirmButtonText: tr('Yes'), cancelButtonText: tr('Cancel') });
	return !!response?.isConfirmed;
};

export const sweetActionConfirmAlert = async (msg: string, confirmText: string): Promise<boolean> => {
	const response = await dialog.fire({
		text: tr(msg),
		confirmButtonText: tr(confirmText),
		cancelButtonText: tr('Cancel'),
	});
	return !!response?.isConfirmed;
};

export const sweetLoginConfirmAlert = async (msg: string): Promise<boolean> => {
	const response = await dialog.fire({ text: tr(msg), confirmButtonText: tr('Login'), cancelButtonText: tr('Cancel') });
	return !!response?.isConfirmed;
};

export const sweetErrorAlert = async (msg: string, duration: number = 3000) => {
	showToast('error', msg, undefined, duration);
};

export const sweetMixinErrorAlert = async (msg: string, duration: number = 3000) => {
	showToast('error', msg, undefined, duration);
};

export const sweetMixinSuccessAlert = async (msg: string, duration: number = 2500) => {
	showToast('success', msg, undefined, Math.max(duration, 2500));
};

export const sweetBasicAlert = async (text: string) => {
	showToast('info', text);
};

export const sweetErrorHandlingForAdmin = async (err: any) => {
	const errorMessage = err.message ?? Messages.error1;
	await Swal.fire({
		icon: 'error',
		text: tr(errorMessage),
		showConfirmButton: false,
	});
};

export const sweetTopSmallSuccessAlert = async (
	msg: string,
	duration: number = 2500,
	enable_forward: boolean = false,
) => {
	showToast('success', msg, undefined, Math.max(duration, 2500));
	if (enable_forward) window.setTimeout(() => window.location.reload(), duration);
};
