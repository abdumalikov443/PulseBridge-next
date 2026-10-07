import React from 'react';
import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
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
	const name = user.memberFullName || user.memberNick;
	const target = useMyFollowTarget();
	const stats: { label: string; value: number; icon: IconName }[] = [
		// patients are not followed; doctors and clinics show the followers of their profile
		...(target ? [{ label: 'Followers', value: target.followers, icon: 'users' as IconName }] : []),
		{ label: 'Following', value: user.memberFollowings, icon: 'userCheck' },
		{ label: 'Articles', value: user.memberArticles, icon: 'comment' },
		{ label: 'Likes', value: user.memberLikes, icon: 'heart' },
	];

	return (
		<>
			<MySection title={`Welcome back, ${name}`} subTitle="Here is what is happening with your health and your account.">
				<div className="pb-stats">
					{stats.map((stat) => (
						<div key={stat.label} className="pb-stat">
							<span>
								<Icon name={stat.icon} size={15} /> {stat.label}
							</span>
							<strong>{formatCount(stat.value ?? 0)}</strong>
						</div>
					))}
				</div>
				<div className="pb-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))' }}>
					{quickActions(user.memberType).map((action) => (
						<Link key={action.href} href={action.href} className="pb-card pb-card--flat pb-card--hover" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
							<span className="pb-avatar" style={{ width: 44, height: 44, background: 'var(--pb-soft-1)', color: 'var(--pb-deep)' }}>
								<Icon name={action.icon} size={20} />
							</span>
							<strong>{action.label}</strong>
						</Link>
					))}
				</div>
			</MySection>
			{user.memberType !== MemberType.ADMIN && <MyAppointments compact />}
		</>
	);
};

export default MyOverview;
