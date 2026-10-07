import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { MemberType } from '../../enums/member.enum';
import { logOut } from '../../auth';
import { sweetConfirmAlert } from '../../sweetAlert';
import Avatar from '../ui/Avatar';
import Icon, { IconName } from '../ui/Icon';
import { formatEnum } from '../../utils';

interface MenuItemType {
	category: string;
	title: string;
	icon: IconName;
}

const overview: MenuItemType = { category: 'overview', title: 'Overview', icon: 'clinic' };
const appointments: MenuItemType = { category: 'myAppointments', title: 'Appointments', icon: 'calendar' };
const joinRequests: MenuItemType = { category: 'joinRequests', title: 'Join requests', icon: 'userPlus' };
// only doctor profiles and clinics can be followed
const followers: MenuItemType = { category: 'followers', title: 'Followers', icon: 'users' };
const common: MenuItemType[] = [
	{ category: 'myFavorites', title: 'Favorites', icon: 'heart' },
	{ category: 'recentlyVisited', title: 'Recently visited', icon: 'eye' },
	{ category: 'followings', title: 'Following', icon: 'userCheck' },
	{ category: 'myProfile', title: 'Profile', icon: 'users' },
];
// only doctors and clinics write articles
const articles: MenuItemType[] = [
	{ category: 'myArticles', title: 'My articles', icon: 'comment' },
	{ category: 'writeArticle', title: 'Write article', icon: 'edit' },
];

// menu items depend on the role: patients book, doctors join clinics, clinics manage doctors
export const getMenuItems = (memberType: string): MenuItemType[] => {
	switch (memberType) {
		case MemberType.CLINIC:
			return [
				overview,
				{ category: 'myClinic', title: 'My clinic', icon: 'clinic' },
				{ category: 'clinicDoctors', title: 'Doctors', icon: 'users' },
				joinRequests,
				appointments,
				followers,
				...articles,
				...common,
			];
		case MemberType.DOCTOR:
			return [overview, appointments, joinRequests, followers, ...articles, ...common];
		case MemberType.PATIENT:
			return [overview, appointments, ...common];
		default:
			return [overview, ...common];
	}
};

const MyMenu = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const category = (router.query.category as string) ?? 'overview';
	const name = user.memberFullName || user.memberNick;

	const logoutHandler = async () => {
		if (await sweetConfirmAlert('Do you want to logout?')) logOut();
	};

	return (
		<aside className="pb-card pb-card--flat pb-side-menu" aria-label="My page">
			<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
				<Avatar name={name} image={user.memberImage && !user.memberImage.startsWith('/img') ? user.memberImage : null} size={52} />
				<div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
					<strong style={{ fontSize: 16 }}>{name}</strong>
					<span className="pb-badge pb-badge--success" style={{ alignSelf: 'flex-start', marginTop: 4, padding: '3px 8px', fontSize: 11 }}>
						{formatEnum(user.memberType)}
					</span>
				</div>
			</div>
			<nav>
				{getMenuItems(user.memberType).map((item) => (
					<Link
						key={item.category}
						href={{ pathname: '/mypage', query: { category: item.category } }}
						scroll={false}
						className={category === item.category ? 'pb-side-menu__item--active' : ''}
						aria-current={category === item.category ? 'page' : undefined}
					>
						<Icon name={item.icon} size={17} />
						{item.title}
					</Link>
				))}
				{user.memberType === MemberType.ADMIN && (
					<Link href="/_admin/users">
						<Icon name="arrow" size={17} />
						Admin panel
					</Link>
				)}
				<button type="button" className="pb-side-menu__item" onClick={logoutHandler}>
					<Icon name="logout" size={17} />
					Logout
				</button>
			</nav>
		</aside>
	);
};

export default MyMenu;
