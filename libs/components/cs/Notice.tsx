import React from 'react';

// platform notices (static until the backend has a notice module)
const notices = [
	{ title: 'Online booking is open for all clinics', date: '2026-10-01', tag: 'New' },
	{ title: 'Doctors can now join clinics through join requests', date: '2026-09-20', tag: 'Update' },
	{ title: 'Community posts are limited to 250 characters', date: '2026-09-12', tag: 'Info' },
];

const Notice = () => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
		{notices.map((notice, index) => (
			<article key={notice.title} className="pb-row" style={{ animationDelay: `${index * 0.06}s` }}>
				<span className="pb-row__main" style={{ cursor: 'default' }}>
					<span className="pb-badge pb-badge--soft">{notice.tag}</span>
					<strong style={{ fontSize: 15 }}>{notice.title}</strong>
				</span>
				<span className="pb-row__cell" style={{ color: 'var(--pb-muted)' }}>
					{notice.date}
				</span>
			</article>
		))}
	</div>
);

export default Notice;
