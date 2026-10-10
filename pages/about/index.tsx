import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { NextPage } from 'next';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import Icon, { IconName } from '../../libs/components/ui/Icon';
import { EcgLine } from '../../libs/components/ui/Loaders';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const steps: { title: string; text: string; icon: IconName }[] = [
	{ title: 'Find', text: 'Search doctors by specialty or browse private and public clinics.', icon: 'search' },
	{ title: 'Book', text: 'Pick a day and a free time. The visit is confirmed right away.', icon: 'calendar' },
	{ title: 'Follow up', text: 'Leave a review, follow your doctor and read health tips.', icon: 'heart' },
];

const roles: { title: string; text: string; icon: IconName }[] = [
	{ title: 'Patients', text: 'Book visits, save favorite doctors and clinics, and join the community.', icon: 'users' },
	{ title: 'Doctors', text: 'Join a clinic, manage appointments and share articles with patients.', icon: 'userCheck' },
	{ title: 'Clinics', text: 'Present the clinic, approve doctors and see every booking in one place.', icon: 'clinic' },
];

// sign-up call to action: only for visitors who are not logged in (checked after mount, the static HTML has no user)
const JoinCta = () => {
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted || user?._id) return null;

	return (
		<section
			className="pb-card pb-card--flat"
			style={{
				marginTop: 48,
				flexDirection: 'row',
				flexWrap: 'wrap',
				alignItems: 'center',
				gap: 16,
				background: 'var(--pb-deep)',
				color: '#fff',
				padding: 32,
			}}
		>
			<div style={{ flex: '1 1 320px' }}>
				<strong style={{ fontFamily: 'var(--pb-font-display)', fontSize: 26 }}>{t('Ready when you are')}</strong>
				<p style={{ margin: '6px 0 0', opacity: 0.85 }}>{t('Create an account as a patient, doctor or clinic.')}</p>
			</div>
			<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
				<Link href={{ pathname: '/cs', query: { tab: 'faq' } }} className="pb-btn pb-btn--outline pb-btn--lg">
					{t('FAQ')}
				</Link>
				<Link href="/account/join" className="pb-btn pb-btn--light pb-btn--lg">
					{t('Get started')} <Icon name="arrow" className="pb-arrow" />
				</Link>
			</div>
		</section>
	);
};

const About: NextPage = () => {
	const { t } = useTranslation('common');
	return (
		<div className="pb-container">
			<section className="pb-hero" style={{ paddingTop: 48 }}>
				<div className="pb-hero__copy">
					<span className="pb-badge pb-badge--soft pb-in" style={{ alignSelf: 'flex-start' }}>
						{t('About PulseBridge')}
					</span>
					<h1 className="pb-hero__title pb-in" style={{ fontSize: 52, animationDelay: '.05s' }}>
						{t('A calmer way to')} <em>{t('reach a doctor.')}</em>
					</h1>
					<p className="pb-hero__lead pb-in" style={{ animationDelay: '.15s' }}>
						{t(
							'PulseBridge connects patients, doctors and clinics. No phone queues: see who works where, pick a time and get confirmed in seconds.',
						)}
					</p>
					<div className="pb-in" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animationDelay: '.25s' }}>
						<Link href={{ pathname: '/cs', query: { tab: 'faq' } }} className="pb-btn pb-btn--primary pb-btn--lg">
							{t('Read the FAQ')} <Icon name="arrow" className="pb-arrow" />
						</Link>
						<Link href="/doctor" className="pb-btn pb-btn--outline pb-btn--lg">
							{t('Find a doctor')}
						</Link>
					</div>
				</div>
				<div
					className="pb-hero__visual"
					style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
					aria-hidden="true"
				>
					<div className="pb-hero__blob pb-hero__blob--a" />
					<div className="pb-hero__blob pb-hero__blob--b" />
					<div
						className="pb-card pb-card--flat"
						style={{ position: 'relative', alignItems: 'center', boxShadow: 'var(--pb-shadow)' }}
					>
						<EcgLine />
					</div>
				</div>
			</section>

			<section className="pb-section">
				<h2 className="pb-title" style={{ marginBottom: 20 }}>
					{t('How it works')}
				</h2>
				<div className="pb-grid">
					{steps.map((step, index) => (
						<article
							key={step.title}
							className="pb-card pb-card--flat pb-in"
							style={{ animationDelay: `${index * 0.1}s` }}
						>
							<span
								className="pb-avatar"
								style={{ width: 48, height: 48, background: 'var(--pb-soft-1)', color: 'var(--pb-deep)' }}
							>
								<Icon name={step.icon} size={22} />
							</span>
							<strong style={{ fontSize: 18 }}>
								{index + 1}. {t(step.title)}
							</strong>
							<p style={{ margin: 0, color: 'var(--pb-muted)', lineHeight: 1.6 }}>{t(step.text)}</p>
						</article>
					))}
				</div>
			</section>

			<section className="pb-section">
				<h2 className="pb-title" style={{ marginBottom: 20 }}>
					{t('Made for three roles')}
				</h2>
				<div className="pb-grid">
					{roles.map((role) => (
						<article key={role.title} className="pb-card pb-card--flat pb-card--hover">
							<span
								className="pb-avatar"
								style={{ width: 48, height: 48, background: 'var(--pb-soft-2)', color: 'var(--pb-ink)' }}
							>
								<Icon name={role.icon} size={22} />
							</span>
							<strong style={{ fontSize: 18 }}>{t(role.title)}</strong>
							<p style={{ margin: 0, color: 'var(--pb-muted)', lineHeight: 1.6 }}>{t(role.text)}</p>
						</article>
					))}
				</div>
			</section>

			<JoinCta />
		</div>
	);
};

export default withPbLayout(About);
