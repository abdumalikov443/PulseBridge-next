import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useQuery, useReactiveVar } from '@apollo/client';
import { GET_FAVORITE_CLINICS, GET_FAVORITE_DOCTORS, GET_MEMBER } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { MemberType } from '../../enums/member.enum';
import { formatCount } from '../ui/ActionChips';
import Icon, { IconName } from '../ui/Icon';
import MySection from './MySection';
import { useMyFollowTarget } from '../../hooks/useMyFollowTarget';
import MyAppointments from './MyAppointments';

interface QuickAction {
	href: string;
	label: string;
	icon: IconName;
}

const quickActions = (memberType: string): QuickAction[] => {
	switch (memberType) {
		case MemberType.CLINIC:
			return [
				{ href: '/mypage?category=myClinic', label: 'Edit my clinic', icon: 'clinic' },
				{ href: '/mypage?category=joinRequests', label: 'Join requests', icon: 'userPlus' },
				{ href: '/mypage?category=clinicDoctors', label: 'Our doctors', icon: 'users' },
				{ href: '/mypage?category=writeArticle', label: 'Write an article', icon: 'comment' },
			];
		case MemberType.DOCTOR:
			return [
				{ href: '/mypage?category=joinRequests', label: 'Join a clinic', icon: 'clinic' },
				{ href: '/mypage?category=myProfile', label: 'Doctor profile', icon: 'edit' },
				{ href: '/mypage?category=writeArticle', label: 'Write an article', icon: 'comment' },
			];
		default:
			return [
				{ href: '/doctor', label: 'Find a doctor', icon: 'search' },
				{ href: '/clinic', label: 'Find a clinic', icon: 'clinic' },
				{ href: '/mypage?category=myFavorites', label: 'My favorites', icon: 'heart' },
			];
	}
};

const MyOverview = () => {
	const user = useReactiveVar(userVar);
	const { t } = useTranslation('common');
	const name = user.memberFullName || user.memberNick;
	const target = useMyFollowTarget();
	const isPatient = user.memberType === MemberType.PATIENT;

	// fresh counters (the login token keeps the values from the moment of login)
	const { data: memberData } = useQuery(GET_MEMBER, {
		fetchPolicy: 'network-only',
		skip: !user._id,
		variables: { input: user._id },
	});
	const favoriteInput = { input: { page: 1, limit: 1 } };
	const { data: favDoctors } = useQuery(GET_FAVORITE_DOCTORS, {
		fetchPolicy: 'network-only',
		skip: !isPatient,
		variables: favoriteInput,
	});
	const { data: favClinics } = useQuery(GET_FAVORITE_CLINICS, {
		fetchPolicy: 'network-only',
		skip: !isPatient,
		variables: favoriteInput,
	});
	const me = memberData?.getMember;
	const favorites =
		(favDoctors?.getFavoriteDoctors?.metaCounter?.[0]?.total ?? 0) +
		(favClinics?.getFavoriteClinics?.metaCounter?.[0]?.total ?? 0);

	const stats: { label: string; value: number; icon: IconName }[] = [
		// doctors and clinics are followed and liked through their profile; patients see what they liked
		...(target ? [{ label: 'Followers', value: target.followers, icon: 'users' as IconName }] : []),
		{ label: 'Following', value: me?.memberFollowings ?? user.memberFollowings, icon: 'userCheck' },
		...(isPatient
			? []
			: [{ label: 'Articles', value: me?.memberArticles ?? user.memberArticles, icon: 'comment' as IconName }]),
		target
			? { label: 'Likes', value: target.likes, icon: 'heart' }
			: { label: 'Favorites', value: favorites, icon: 'heart' },
	];

	return (
		<>
			<MySection
				title={t('Welcome back, {{name}}', { name })}
				subTitle="Here is what is happening with your health and your account."
			>
				<div className="pb-stat-strip">
					{stats.map((stat) => (
						<div key={stat.label}>
							<span className="pb-stat-strip__icon">
								<Icon name={stat.icon} size={18} />
							</span>
							<span>
								<strong>{formatCount(stat.value ?? 0)}</strong>
								<small>{t(stat.label)}</small>
							</span>
						</div>
					))}
				</div>
			</MySection>
			{user.memberType !== MemberType.ADMIN && <MyAppointments compact />}
			<nav className="pb-quick-links" aria-label={t('Quick links')}>
				{quickActions(user.memberType).map((action) => (
					<Link key={action.href} href={action.href}>
						<Icon name={action.icon} size={16} />
						{t(action.label)}
						<Icon name="arrow" size={14} className="pb-arrow" />
					</Link>
				))}
			</nav>
		</>
	);
};

export default MyOverview;
