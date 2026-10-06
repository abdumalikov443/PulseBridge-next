import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import Notice from '../../libs/components/cs/Notice';
import Faq from '../../libs/components/cs/Faq';
import Icon from '../../libs/components/ui/Icon';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const tabs = [
	{ id: 'faq', label: 'FAQ' },
	{ id: 'notice', label: 'Notices' },
];

const CS: NextPage = () => {
	const router = useRouter();
	const tab = (router.query.tab as string) ?? 'faq';

	return (
		<div className="pb-container" style={{ maxWidth: 900 }}>
			<header className="pb-page-head">
				<h1 className="pb-title">Help center</h1>
				<p>Answers about clinics, doctors and appointments.</p>
			</header>

			<div className="pb-pills" role="tablist" aria-label="Help sections" style={{ padding: '16px 0 20px' }}>
				{tabs.map((item) => (
					<Link
						key={item.id}
						role="tab"
						aria-selected={tab === item.id}
						href={{ pathname: '/cs', query: { tab: item.id } }}
						scroll={false}
						className={`pb-pill ${tab === item.id ? 'pb-pill--active' : ''}`}
						style={{ display: 'inline-flex', alignItems: 'center' }}
					>
						{item.label}
					</Link>
				))}
			</div>

			{tab === 'notice' ? <Notice /> : <Faq />}

			<section className="pb-card pb-card--flat" style={{ marginTop: 32, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, background: 'var(--pb-deep)', color: '#fff' }}>
				<div style={{ flex: '1 1 300px' }}>
					<strong style={{ fontFamily: 'var(--pb-font-display)', fontSize: 22 }}>Still need help?</strong>
					<p style={{ margin: '6px 0 0', opacity: 0.85 }}>Ask the community or talk to a doctor directly.</p>
				</div>
				<Link href="/community" className="pb-btn pb-btn--light">
					Ask the community <Icon name="arrow" className="pb-arrow" />
				</Link>
			</section>
		</div>
	);
};

export default withPbLayout(CS);
