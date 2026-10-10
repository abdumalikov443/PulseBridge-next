import React, { ReactNode } from 'react';
import { useTranslation } from 'next-i18next';

interface MySectionProps {
	title: string;
	subTitle?: string;
	actions?: ReactNode;
	children: ReactNode;
}

// heading + body used by every My Page section
const MySection = ({ title, subTitle, actions, children }: MySectionProps) => {
	const { t } = useTranslation('common');
	return (
		<section className="pb-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
			<div className="pb-section-head" style={{ marginBottom: 0 }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
					<h1 className="pb-title" style={{ fontSize: 28 }}>
						{t(title)}
					</h1>
					{subTitle && <p style={{ margin: 0, color: 'var(--pb-muted)', fontSize: 15 }}>{t(subTitle)}</p>}
				</div>
				{actions}
			</div>
			{children}
		</section>
	);
};

export default MySection;
