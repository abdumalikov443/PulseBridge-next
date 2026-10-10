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
					<p>{t('Find clinics and doctors, book a visit and follow your health in one place.')}</p>
				</div>
				<nav aria-label={t('Explore')} className="pb-footer__col">
					<strong>{t('Explore')}</strong>
					<Link href="/doctor">{t('Doctors')}</Link>
					<Link href="/clinic">{t('Clinics')}</Link>
					<Link href="/community">{t('Community')}</Link>
				</nav>
				<nav aria-label={t('Account')} className="pb-footer__col">
					<strong>{t('Account')}</strong>
					<Link href="/mypage">{t('My Page')}</Link>
					<Link href="/account/join">
						{t('Login')} / {t('Register')}
					</Link>
				</nav>
				<nav aria-label={t('Help')} className="pb-footer__col">
					<strong>{t('Help')}</strong>
					<Link href="/cs">{t('FAQ')}</Link>
					<Link href="/about">{t('About')}</Link>
				</nav>
			</div>
			<div className="pb-container pb-footer__bottom">
				<span>© PulseBridge {moment().year()}</span>
				<span>{t('Not a replacement for emergency care. In an emergency call 119.')}</span>
			</div>
		</footer>
	);
};

export default PbFooter;
