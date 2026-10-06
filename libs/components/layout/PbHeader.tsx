import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { Menu, MenuItem } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { getJwtToken, logOut, updateUserInfo } from '../../auth';
import { MemberType } from '../../enums/member.enum';
import NotificationMenu from '../common/NotificationMenu';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';

const languages = [
	{ id: 'en', label: 'English' },
	{ id: 'kr', label: '한국어' },
	{ id: 'ru', label: 'Русский' },
];

const PbHeader = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [menuOpen, setMenuOpen] = useState(false);
	const [userAnchor, setUserAnchor] = useState<null | HTMLElement>(null);
	const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);

	const nav = [
		{ href: '/', label: t('Home') },
		{ href: '/doctor', label: t('Doctors') },
		{ href: '/clinic', label: t('Clinics') },
		{ href: '/community', label: t('Community') },
		{ href: '/cs', label: t('CS') },
	];

	/** LIFECYCLES **/

	useEffect(() => {
		const jwt = getJwtToken();
		if (jwt) updateUserInfo(jwt);
	}, []);

	useEffect(() => {
		setMenuOpen(false);
	}, [router.asPath]);

	/** HANDLERS **/

	const isActive = (href: string) => (href === '/' ? router.pathname === '/' : router.pathname.startsWith(href));

	const changeLanguage = async (locale: string) => {
		setLangAnchor(null);
		localStorage.setItem('locale', locale);
		await router.push(router.asPath, router.asPath, { locale });
	};

	return (
		<header className="pb-header">
			<div className="pb-container pb-header__bar">
				<Link href="/" className="pb-logo" aria-label="PulseBridge home">
					<span className="pb-logo__dot" aria-hidden="true">
						<span />
						<span />
					</span>
					pulsebridge
				</Link>

				<nav aria-label="Main" className={`pb-header__nav ${menuOpen ? 'pb-header__nav--open' : ''}`}>
					{nav.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`pb-header__link ${isActive(item.href) ? 'pb-header__link--active' : ''}`}
						>
							{item.label}
						</Link>
					))}
				</nav>

				<div className="pb-header__actions">
					<button
						type="button"
						className="pb-icon-btn"
						aria-label="Language"
						onClick={(e) => setLangAnchor(e.currentTarget)}
					>
						<span style={{ fontSize: 13, fontWeight: 700 }}>{(router.locale ?? 'en').toUpperCase()}</span>
					</button>
					<Menu anchorEl={langAnchor} open={Boolean(langAnchor)} onClose={() => setLangAnchor(null)}>
						{languages.map((lang) => (
							<MenuItem key={lang.id} selected={router.locale === lang.id} onClick={() => changeLanguage(lang.id)}>
								{lang.label}
							</MenuItem>
						))}
					</Menu>

					{user?._id ? (
						<>
							<span className="pb-icon-btn">
								<NotificationMenu />
							</span>
							<button
								type="button"
								className="pb-header__user"
								aria-label="Account menu"
								onClick={(e) => setUserAnchor(e.currentTarget)}
							>
								<Avatar
									name={user.memberFullName || user.memberNick}
									image={user.memberImage && !user.memberImage.startsWith('/img') ? user.memberImage : null}
									size={40}
								/>
							</button>
							<Menu anchorEl={userAnchor} open={Boolean(userAnchor)} onClose={() => setUserAnchor(null)}>
								<MenuItem disabled>{user.memberNick}</MenuItem>
								<MenuItem onClick={() => router.push('/mypage')}>{t('My Page')}</MenuItem>
								{user.memberType === MemberType.ADMIN && (
									<MenuItem onClick={() => router.push('/_admin/users')}>Admin</MenuItem>
								)}
								<MenuItem onClick={() => logOut()}>
									<Icon name="logout" size={16} />
									<span style={{ marginLeft: 8 }}>Logout</span>
								</MenuItem>
							</Menu>
						</>
					) : (
						<Link href="/account/join" className="pb-btn pb-btn--primary pb-btn--sm pb-header__login" aria-label={t('Login')}>
							<Icon name="userPlus" size={16} />
							<span>
								{t('Login')} / {t('Register')}
							</span>
						</Link>
					)}

					<button
						type="button"
						className="pb-icon-btn pb-header__burger"
						aria-label={menuOpen ? 'Close menu' : 'Open menu'}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((prev) => !prev)}
					>
						<Icon name={menuOpen ? 'close' : 'menu'} size={20} />
					</button>
				</div>
			</div>
		</header>
	);
};

export default PbHeader;
