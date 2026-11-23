import type { ComponentType } from 'react';
import { useTranslation } from 'next-i18next';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, MenuItem } from '@mui/material';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { getJwtToken, logOut, updateUserInfo } from '../../auth';
import { MemberType } from '../../enums/member.enum';
import AdminMenuList, { sections } from '../admin/AdminMenuList';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { EcgLine } from '../ui/Loaders';

// admin pages: Soft Care side menu + top bar; only ADMIN members get in
const withAdminLayout = (Component: ComponentType) => {
	const AdminLayout = (props: object) => {
		const router = useRouter();
		const { t } = useTranslation('common');
		const user = useReactiveVar(userVar);
		const [checked, setChecked] = useState(false);
		const [menuOpen, setMenuOpen] = useState(false);
		const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);

		/** LIFECYCLES **/
		useEffect(() => {
			const jwt = getJwtToken();
			if (jwt) updateUserInfo(jwt);
			setChecked(true);
		}, []);

		useEffect(() => {
			if (checked && userVar().memberType !== MemberType.ADMIN) router.replace('/').then();
		}, [checked, user, router]);

		useEffect(() => setMenuOpen(false), [router.asPath]);

		if (!checked || user.memberType !== MemberType.ADMIN) {
			return (
				<div className="pb-app" style={{ alignItems: 'center', justifyContent: 'center' }}>
					<EcgLine />
				</div>
			);
		}

		const name = user.memberFullName || user.memberNick;
		// the menu item the current page belongs to names the page in the top bar
		const pageTitle =
			sections
				.flatMap((section) => section.links)
				.filter((link) =>
					link.href === '/_admin' ? router.pathname === '/_admin' : router.pathname.startsWith(link.href),
				)[0]?.label ?? 'Admin panel';

		return (
			<>
				<Head>
					<title>{`${t('Admin')} · PulseBridge`}</title>
					<meta name="viewport" content="width=device-width, initial-scale=1" />
				</Head>
				<div className="pb-app pb-admin">
					<aside className={`pb-admin__side ${menuOpen ? 'pb-admin__side--open' : ''}`}>
						<Link href="/_admin" className="pb-brand pb-admin__brand">
							<span className="pb-brand__mark" aria-hidden="true">
								<Icon name="pulse" size={22} />
							</span>
							<span className="pb-brand__text">
								<span className="pb-brand__name">PulseBridge</span>
								<span className="pb-admin__brand-sub">{t('Admin panel')}</span>
							</span>
						</Link>
						<AdminMenuList />
						<div className="pb-admin__foot">
							<Link href="/" className="pb-admin__link">
								<Icon name="arrowLeft" size={17} /> {t('Back to site')}
							</Link>
						</div>
					</aside>
					{menuOpen && (
						<button
							type="button"
							className="pb-admin__scrim"
							aria-label={t('Close menu')}
							onClick={() => setMenuOpen(false)}
						/>
					)}

					<div className="pb-admin__body">
						<header className="pb-admin__top">
							<button
								type="button"
								className="pb-icon-btn pb-admin__burger"
								aria-label={t('Open menu')}
								aria-expanded={menuOpen}
								onClick={() => setMenuOpen((prev) => !prev)}
							>
								<Icon name={menuOpen ? 'close' : 'menu'} size={20} />
							</button>
							<span className="pb-admin__crumb">
								<span>{t('Admin')}</span>
								<Icon name="arrow" size={14} />
								<strong>{t(pageTitle)}</strong>
							</span>
							<button
								type="button"
								className="pb-admin__me"
								aria-label={t('Account menu')}
								onClick={(e) => setUserAnchor(e.currentTarget)}
							>
								<span className="pb-admin__me-text">
									<strong>{name}</strong>
									<small>{t('Administrator')}</small>
								</span>
								<Avatar
									name={name}
									image={user.memberImage && !user.memberImage.startsWith('/img') ? user.memberImage : null}
									size={40}
								/>
							</button>
							<Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)}>
								<MenuItem disabled>{user.memberNick}</MenuItem>
								<MenuItem onClick={() => logOut()}>{t('Logout')}</MenuItem>
							</Menu>
						</header>
						<main className="pb-admin__content">
							<Component {...props} />
						</main>
					</div>
				</div>
			</>
		);
	};
	return AdminLayout;
};

export default withAdminLayout;
