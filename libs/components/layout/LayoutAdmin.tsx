import type { ComponentType } from 'react';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, MenuItem } from '@mui/material';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { getJwtToken, logOut, updateUserInfo } from '../../auth';
import { MemberType } from '../../enums/member.enum';
import AdminMenuList from '../admin/AdminMenuList';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { EcgLine } from '../ui/Loaders';

// admin pages: Soft Care side menu + top bar; only ADMIN members get in
const withAdminLayout = (Component: ComponentType) => {
	const AdminLayout = (props: object) => {
		const router = useRouter();
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

		return (
			<>
				<Head>
					<title>Admin · PulseBridge</title>
					<meta name="viewport" content="width=device-width, initial-scale=1" />
				</Head>
				<div className="pb-app pb-admin">
					<aside className={`pb-admin__side ${menuOpen ? 'pb-admin__side--open' : ''}`}>
						<Link href="/" className="pb-logo">
							<span className="pb-logo__dot" aria-hidden="true">
								<span />
								<span />
							</span>
							pulsebridge
						</Link>
						<span className="pb-badge pb-badge--soft" style={{ alignSelf: 'flex-start' }}>
							Admin panel
						</span>
						<AdminMenuList />
					</aside>

					<div className="pb-admin__body">
						<header className="pb-admin__top">
							<button type="button" className="pb-icon-btn pb-admin__burger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((prev) => !prev)}>
								<Icon name={menuOpen ? 'close' : 'menu'} size={20} />
							</button>
							<Link href="/" className="pb-btn pb-btn--light pb-btn--sm">
								<Icon name="arrowLeft" size={16} /> Back to site
							</Link>
							<button type="button" className="pb-header__user" aria-label="Account menu" onClick={(e) => setUserAnchor(e.currentTarget)} style={{ marginLeft: 'auto' }}>
								<Avatar name={name} image={user.memberImage && !user.memberImage.startsWith('/img') ? user.memberImage : null} size={40} />
							</button>
							<Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)}>
								<MenuItem disabled>{user.memberNick}</MenuItem>
								<MenuItem onClick={() => logOut()}>Logout</MenuItem>
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
