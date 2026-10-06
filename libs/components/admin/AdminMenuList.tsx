import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon, { IconName } from '../ui/Icon';

interface MenuLink {
	href: string;
	label: string;
	icon: IconName;
}

const sections: { title: string; links: MenuLink[] }[] = [
	{ title: 'Members', links: [{ href: '/_admin/users', label: 'Users', icon: 'users' }] },
	{
		title: 'Care',
		links: [
			{ href: '/_admin/clinics', label: 'Clinics', icon: 'clinic' },
			{ href: '/_admin/doctors', label: 'Doctors', icon: 'userCheck' },
			{ href: '/_admin/appointments', label: 'Appointments', icon: 'calendar' },
		],
	},
	{ title: 'Community', links: [{ href: '/_admin/community', label: 'Articles', icon: 'comment' }] },
	{
		title: 'Help center',
		links: [
			{ href: '/_admin/cs/faq', label: 'FAQ', icon: 'search' },
			{ href: '/_admin/cs/notice', label: 'Notices', icon: 'bell' },
			{ href: '/_admin/cs/inquiry', label: 'Inquiries', icon: 'phone' },
		],
	},
];

const AdminMenuList = () => {
	const router = useRouter();

	return (
		<nav aria-label="Admin" className="pb-admin__nav">
			{sections.map((section) => (
				<div key={section.title} className="pb-admin__group">
					<span className="pb-admin__group-title">{section.title}</span>
					{section.links.map((link) => {
						const active = router.pathname.startsWith(link.href);
						return (
							<Link key={link.href} href={link.href} className={`pb-admin__link ${active ? 'pb-admin__link--active' : ''}`} aria-current={active ? 'page' : undefined}>
								<Icon name={link.icon} size={17} />
								{link.label}
							</Link>
						);
					})}
				</div>
			))}
		</nav>
	);
};

export default AdminMenuList;
