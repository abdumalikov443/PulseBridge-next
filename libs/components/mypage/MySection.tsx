import React, { ReactNode } from 'react';

interface MySectionProps {
	title: string;
	subTitle?: string;
	actions?: ReactNode;
	children: ReactNode;
}

// heading + body used by every My Page section
const MySection = ({ title, subTitle, actions, children }: MySectionProps) => (
	<section className="pb-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
		<div className="pb-section-head" style={{ marginBottom: 0 }}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
				<h1 className="pb-title" style={{ fontSize: 28 }}>
					{title}
				</h1>
				{subTitle && <p style={{ margin: 0, color: 'var(--pb-muted)', fontSize: 15 }}>{subTitle}</p>}
			</div>
			{actions}
		</div>
		{children}
	</section>
);

export default MySection;
