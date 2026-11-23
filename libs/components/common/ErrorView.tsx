import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Icon, { IconName } from '../ui/Icon';

export type ErrorCode = 404 | 401 | 403 | 500;

interface ErrorCopy {
	title: string;
	lead: string;
	detail: string;
	state: string;
	primary: { label: string; icon: IconName; href?: string; action?: 'back' | 'reload' };
	secondary: { label: string; icon: IconName; href: string };
}

// texts are English keys (translated below); the monitor line on top shows the "patient state"
const COPY: Record<ErrorCode, ErrorCopy> = {
	404: {
		title: 'Page not found',
		lead: 'This page has no pulse, but we are here.',
		detail: 'The address may have been removed, changed or never existed.',
		state: 'FLATLINE',
		primary: { label: 'Find a doctor', icon: 'stethoscope', href: '/doctor' },
		secondary: { label: 'Home', icon: 'clinic', href: '/' },
	},
	401: {
		title: 'Please log in first',
		lead: 'This page needs you to be signed in.',
		detail: 'Log in to see your appointments, profile and bookings.',
		state: 'NO SIGNAL',
		primary: { label: 'Log in', icon: 'userCheck', href: '/account/join' },
		secondary: { label: 'Home', icon: 'clinic', href: '/' },
	},
	403: {
		title: 'Access denied',
		lead: 'This area is not for your role.',
		detail: 'Only the owner of this record or members with the right role can open it.',
		state: 'ACCESS LOCKED',
		primary: { label: 'Go back', icon: 'arrowLeft', action: 'back' },
		secondary: { label: 'Home', icon: 'clinic', href: '/' },
	},
	500: {
		title: 'The server did not respond',
		lead: 'Our system is taking a short break.',
		detail: 'Try again in a moment. If it keeps happening, come back a little later.',
		state: 'ARRHYTHMIA',
		primary: { label: 'Try again', icon: 'pulse', action: 'reload' },
		secondary: { label: 'Home', icon: 'clinic', href: '/' },
	},
};

// heartbeat traces left and right of the code; 403 ends in a flat line with a stop dot
const LEFT = 'M0 60 H70 L82 60 L92 42 L104 86 L120 8 L136 104 L150 52 L160 60 H230';
const RIGHT = 'M0 60 H40 L52 60 L62 42 L74 86 L90 8 L106 104 L120 52 L130 60 H230';
const FLAT = 'M0 60 H230';

// error page in the vital-monitor style: 404 (missing page), 401 (login needed), 403 (no access), 500 (server)
const ErrorView = ({ code }: { code: ErrorCode }) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const copy = COPY[code];
	const bpm = code === 500 ? '???' : code === 404 ? '00' : '--';

	const primaryClick = () => {
		if (copy.primary.action === 'back') window.history.length > 1 ? router.back() : router.push('/');
		if (copy.primary.action === 'reload') window.location.reload();
	};
	const primaryBody = (
		<>
			<Icon name={copy.primary.icon} size={17} />
			{t(copy.primary.label)}
		</>
	);

	return (
		<div className="pb-container">
			<section className={`pb-error pb-error--${code}`} aria-labelledby="error-title">
				<div className="pb-error__bar">
					<span className="pb-error__badge">
						<i aria-hidden="true" />
						{t('Vital monitor')}
					</span>
					<span className="pb-error__meta">
						BPM: <b>{bpm}</b> [{t(copy.state)}] <span className="pb-error__ref">REF: #ERR-{code}-ECG-TRACE</span>
					</span>
				</div>

				<div className="pb-error__trace" aria-hidden="true">
					<svg viewBox="0 0 230 112" preserveAspectRatio="none" className="pb-error__line">
						<path d={LEFT} />
						<circle cx="228" cy="60" r="3.5" />
					</svg>
					<span className="pb-error__code">
						{String(code)
							.split('')
							.map((digit, i) => (
								<span key={i} style={{ animationDelay: `${0.35 + i * 0.18}s` }}>
									{digit}
								</span>
							))}
					</span>
					<svg viewBox="0 0 230 112" preserveAspectRatio="none" className="pb-error__line pb-error__line--right">
						<circle cx="2" cy="60" r="3.5" />
						<path d={code === 403 ? FLAT : RIGHT} />
					</svg>
				</div>

				<h1 id="error-title" className="pb-error__title">
					{t(copy.title)}
				</h1>
				<p className="pb-error__lead">{t(copy.lead)}</p>
				<p className="pb-error__detail">{t(copy.detail)}</p>

				{/* the main action is on the right, as on a monitor's confirm key */}
				<div className="pb-error__actions">
					<Link href={copy.secondary.href} className="pb-error__btn">
						<Icon name={copy.secondary.icon} size={17} />
						{t(copy.secondary.label)}
					</Link>
					{copy.primary.href ? (
						<Link
							href={
								code === 401 ? { pathname: copy.primary.href, query: { referrer: router.asPath } } : copy.primary.href
							}
							className="pb-error__btn pb-error__btn--main"
						>
							{primaryBody}
						</Link>
					) : (
						<button type="button" className="pb-error__btn pb-error__btn--main" onClick={primaryClick}>
							{primaryBody}
						</button>
					)}
				</div>
			</section>
		</div>
	);
};

export default ErrorView;
