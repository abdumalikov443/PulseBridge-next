import { tr } from './i18n';

// small toast messages (top right, under the header); they close by themselves
// and live on document.body, so they stay visible while the page changes

export type ToastKind = 'success' | 'error' | 'info';

const ICONS: Record<ToastKind, string> = {
	success: '<path d="M20 6 9 17l-5-5" />',
	error: '<path d="M18 6 6 18M6 6l12 12" />',
	info: '<path d="M12 8h.01M11 12h1v4h1" /><circle cx="12" cy="12" r="9" />',
};

const svg = (paths: string, size: number) =>
	`<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const getStack = (): HTMLElement => {
	let stack = document.getElementById('pb-toasts');
	if (!stack) {
		stack = document.createElement('div');
		stack.id = 'pb-toasts';
		stack.className = 'pb-toasts';
		stack.setAttribute('aria-live', 'polite');
		document.body.appendChild(stack);
	}
	return stack;
};

export const showToast = (kind: ToastKind, message: string, detail?: string, duration: number = 3000) => {
	if (typeof window === 'undefined' || !message) return;
	// messages are English keys (ours and the API's); they show in the current language
	const text = tr(message);
	const stack = getStack();
	// the same message twice in a row only resets the timer
	const last = stack.lastElementChild as HTMLElement | null;
	if (last?.dataset.text === `${kind}:${text}`) last.remove();

	const toast = document.createElement('div');
	toast.className = `pb-toast pb-toast--${kind}`;
	toast.dataset.text = `${kind}:${text}`;
	toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');
	toast.style.setProperty('--pb-toast-time', `${duration}ms`);

	const icon = document.createElement('span');
	icon.className = 'pb-toast__icon';
	icon.innerHTML = svg(ICONS[kind], 14);

	const body = document.createElement('p');
	body.textContent = text;
	if (detail) {
		const small = document.createElement('small');
		small.textContent = tr(detail);
		body.appendChild(small);
	}

	const close = document.createElement('button');
	close.type = 'button';
	close.setAttribute('aria-label', tr('Dismiss'));
	close.innerHTML = svg(ICONS.error, 14);

	toast.append(icon, body, close);
	stack.appendChild(toast);

	let timer = window.setTimeout(() => remove(), duration);
	const remove = () => {
		window.clearTimeout(timer);
		toast.classList.add('is-out');
		window.setTimeout(() => toast.remove(), 200);
	};
	close.addEventListener('click', remove);
	// hovering keeps the message open
	toast.addEventListener('mouseenter', () => window.clearTimeout(timer));
	toast.addEventListener('mouseleave', () => (timer = window.setTimeout(() => remove(), 1500)));
};
