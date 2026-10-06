import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next';

const PbFooter = () => {
	const { t } = useTranslation('common');

	return (
		<footer className="pb-footer">
			<div className="pb-container pb-footer__grid">
				<div className="pb-footer__brand">
					<span className="pb-logo">
						<span className="pb-logo__dot" aria-hidden="true">
							<span />
							<span />
						</span>
						pulsebridge
					</span>
					<p>Find clinics and doctors, book a visit and follow your health in one place.</p>
				</div>
				<nav aria-label="Explore" className="pb-footer__col">
					<strong>Explore</strong>
					<Link href="/doctor">{t('Doctors')}</Link>
					<Link href="/clinic">{t('Clinics')}</Link>
					<Link href="/community">{t('Community')}</Link>
				</nav>
				<nav aria-label="Account" className="pb-footer__col">
					<strong>Account</strong>
					<Link href="/mypage">{t('My Page')}</Link>
					<Link href="/account/join">
						{t('Login')} / {t('Register')}
					</Link>
				</nav>
				<nav aria-label="Help" className="pb-footer__col">
					<strong>Help</strong>
					<Link href="/cs">FAQ</Link>
					<Link href="/about">About</Link>
				</nav>
			</div>
			<div className="pb-container pb-footer__bottom">
				<span>© PulseBridge {moment().year()}</span>
				<span>Not a replacement for emergency care. In an emergency call 119.</span>
			</div>
		</footer>
	);
};

export default PbFooter;
