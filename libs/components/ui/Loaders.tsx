import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { pendingRequestsVar, serverReadyVar } from '../../../apollo/store';

const ECG_PATH = 'M0 44 H70 L80 44 L88 20 L100 70 L112 6 L122 54 L130 44 H220';
const ECG_SMALL = 'M0 11 H22 L26 11 L29 3 L33 18 L37 1 L40 11 H64';

// heartbeat line: big (server / section) or small (inside a button)
export const EcgLine = ({ small = false, width }: { small?: boolean; width?: number | string }) =>
	small ? (
		<svg className="pb-ecg pb-ecg--button" aria-hidden="true" width={width ?? 56} height={18} viewBox="0 0 64 20">
			<path className="pb-ecg__line" d={ECG_SMALL} strokeWidth={2} />
		</svg>
	) : (
		<svg className="pb-ecg" aria-hidden="true" width={width ?? 220} height={80} viewBox="0 0 220 80">
			<path className="pb-ecg__track" d={ECG_PATH} strokeWidth={3} />
			<path className="pb-ecg__line" d={ECG_PATH} strokeWidth={3} />
		</svg>
	);

// full screen loader while the API answers its first request (cold start)
export const ServerLoader = () => {
	const ready = useReactiveVar(serverReadyVar);
	const pending = useReactiveVar(pendingRequestsVar);
	const [slow, setSlow] = useState(false);

	useEffect(() => {
		if (ready || pending === 0) {
			setSlow(false);
			return;
		}
		// only show it when the server is really slow, not on every first request
		const timer = setTimeout(() => setSlow(true), 900);
		return () => clearTimeout(timer);
	}, [ready, pending]);

	if (ready || !slow) return null;
	return (
		<div className="pb-server-loader" role="status" aria-live="polite">
			<EcgLine />
			<strong>Connecting to PulseBridge…</strong>
			<span>Waking up the server, this takes a few seconds</span>
		</div>
	);
};

// thin bar on top while a route is changing
export const NavProgress = () => {
	const router = useRouter();
	const [active, setActive] = useState(false);

	useEffect(() => {
		const start = (url: string) => url !== router.asPath && setActive(true);
		const stop = () => setActive(false);
		router.events.on('routeChangeStart', start);
		router.events.on('routeChangeComplete', stop);
		router.events.on('routeChangeError', stop);
		return () => {
			router.events.off('routeChangeStart', start);
			router.events.off('routeChangeComplete', stop);
			router.events.off('routeChangeError', stop);
		};
	}, [router]);

	if (!active) return null;
	return (
		<div className="pb-nav-progress" role="progressbar" aria-label="Loading page">
			<span />
		</div>
	);
};

// placeholder cards while a list loads
export const SkeletonCards = ({ count = 3 }: { count?: number }) => (
	<>
		{Array.from({ length: count }, (_, i) => (
			<div className="pb-skeleton-card" key={i} role="status" aria-label="Loading">
				<div className="pb-skeleton-card__row">
					<span className="pb-skeleton" style={{ width: 52, height: 52, borderRadius: 26, flex: 'none' }} />
					<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
						<span className="pb-skeleton" style={{ height: 14, width: '60%' }} />
						<span className="pb-skeleton" style={{ height: 12, width: '40%' }} />
					</div>
				</div>
				<span className="pb-skeleton" style={{ height: 36, width: '70%', borderRadius: 999 }} />
			</div>
		))}
	</>
);
