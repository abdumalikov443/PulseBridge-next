import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon, { IconName } from '../ui/Icon';

interface MenuLink {
	href: string;
	label: string;
	icon: IconName;
}

export const sections: { title: string; links: MenuLink[] }[] = [
	{ title: '', links: [{ href: '/_admin', label: 'Overview', icon: 'pulse' }] },
	{ title: 'Members', links: [{ href: '/_admin/users', label: 'Members', icon: 'users' }] },
	{
		title: 'Care',
		links: [
			{ href: '/_admin/clinics', label: 'Clinics', icon: 'clinic' },
			{ href: '/_admin/doctors', label: 'Doctors', icon: 'userCheck' },
			{ href: '/_admin/appointments', label: 'Appointments', icon: 'calendar' },
		],
	},
	{
		title: 'Community',
		links: [
			{ href: '/_admin/community', label: 'Articles', icon: 'book' },
			{ href: '/_admin/comments', label: 'Comments', icon: 'comment' },
		],
	},
	{
		title: 'Help center',
		links: [
			{ href: '/_admin/cs/faq', label: 'FAQ', icon: 'search' },
			{ href: '/_admin/cs/notice', label: 'Notices', icon: 'bell' },
		],
	},
];

const AdminMenuList = () => {
	const router = useRouter();
	const { t } = useTranslation('common');

	return (
		<nav aria-label={t('Admin')} className="pb-admin__nav">
			{sections.map((section) => (
				<div key={section.title} className="pb-admin__group">
					{section.title && <span className="pb-admin__group-title">{t(section.title)}</span>}
					{section.links.map((link) => {
						// the overview is the admin root, so it matches only itself
						const active =
							link.href === '/_admin' ? router.pathname === '/_admin' : router.pathname.startsWith(link.href);
						return (
							<Link
								key={link.href}
								href={link.href}
								className={`pb-admin__link ${active ? 'pb-admin__link--active' : ''}`}
								aria-current={active ? 'page' : undefined}
							>
								<Icon name={link.icon} size={17} />
								{t(link.label)}
							</Link>
						);
					})}
				</div>
			))}
		</nav>
	);
};

export default AdminMenuList;
