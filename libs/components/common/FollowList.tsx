import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Pagination } from '@mui/material';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_CLINICS, GET_DOCTORS, GET_MEMBER_FOLLOWERS, GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';
import { LIKE_TARGET_CLINIC, LIKE_TARGET_DOCTOR } from '../../../apollo/user/mutation';
import { useFollowing, useLikeToggle } from '../../hooks/useEngagement';
import { Member } from '../../types/member/member';
import { Doctor } from '../../types/doctor/doctor';
import { Clinic } from '../../types/clinic/clinic';
import { MemberType } from '../../enums/member.enum';
import { T } from '../../types/common';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { SkeletonCards } from '../ui/Loaders';

interface FollowListProps {
	mode: 'followers' | 'followings';
	memberId: string;
}

const LIMIT = 10;
// follow lists give member ids only; doctor and clinic ids (for like and their page) come from these lists
const TARGET_LIMIT = 100;

const usePageTargets = () => {
	const [doctors, setDoctors] = useState<Record<string, Doctor>>({});
	const [clinics, setClinics] = useState<Record<string, Clinic>>({});
	const byMember = <V extends { memberId: string }>(list: V[] = []) =>
		list.reduce<Record<string, V>>((acc, item) => ({ ...acc, [item.memberId]: item }), {});

	useQuery(GET_DOCTORS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: TARGET_LIMIT, search: {} } },
		onCompleted: (data: T) => setDoctors(byMember(data?.getDoctors?.list)),
	});
	useQuery(GET_CLINICS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: TARGET_LIMIT, search: {} } },
		onCompleted: (data: T) => setClinics(byMember(data?.getClinics?.list)),
	});

	return { doctors, clinics };
};

// followers or followings of a member: doctors and clinics link to their page with like and follow; patients are plain rows
const FollowList = ({ mode, memberId }: FollowListProps) => {
	const user = useReactiveVar(userVar);
	const [page, setPage] = useState(1);
	const [members, setMembers] = useState<Member[] | null>(null);
	const [total, setTotal] = useState(0);
	const { isFollowing, canFollow, toggleFollow } = useFollowing();
	const doctorLike = useLikeToggle(LIKE_TARGET_DOCTOR);
	const clinicLike = useLikeToggle(LIKE_TARGET_CLINIC);
	const { doctors, clinics } = usePageTargets();
	const isFollowers = mode === 'followers';
	const key = isFollowers ? 'getMemberFollowers' : 'getMemberFollowings';

	/** APOLLO REQUESTS **/
	useQuery(isFollowers ? GET_MEMBER_FOLLOWERS : GET_MEMBER_FOLLOWINGS, {
		fetchPolicy: 'network-only',
		skip: !memberId,
		variables: { input: { page, limit: LIMIT, search: isFollowers ? { followingId: memberId } : { followerId: memberId } } },
		onCompleted: (data: T) => {
			const list = data?.[key]?.list ?? [];
			setMembers(list.map((ele: T) => (isFollowers ? ele.followerData : ele.followingData)).filter(Boolean));
			setTotal(data?.[key]?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setMembers([]),
	});

	const rows = useMemo(
		() =>
			(members ?? []).map((member) => {
				const doctor = member.memberType === MemberType.DOCTOR ? doctors[member._id] : undefined;
				const clinic = member.memberType === MemberType.CLINIC ? clinics[member._id] : undefined;
				const isPro = member.memberType === MemberType.DOCTOR || member.memberType === MemberType.CLINIC;
				let href: string | null = null;
				if (member._id === user._id) href = '/mypage';
				else if (doctor) href = `/doctor/detail?id=${doctor._id}`;
				else if (clinic) href = `/clinic/detail?id=${clinic._id}`;
				else if (isPro) href = `/member?memberId=${member._id}`;
				return { member, doctor, clinic, isPro, href };
			}),
		[members, doctors, clinics, user._id],
	);

	return (
		<div className="pb-follow-list">
			{members === null && <SkeletonCards count={3} />}
			{members?.length === 0 && <p className="pb-empty">{isFollowers ? 'No followers yet.' : 'Not following anyone yet.'}</p>}
			{rows.map(({ member, doctor, clinic, isPro, href }) => {
				const name = getMemberName(member);
				const role = doctor ? `Doctor · ${formatEnum(doctor.specialty)}` : clinic ? `Clinic · ${formatEnum(clinic.clinicType)}` : formatEnum(member.memberType);
				const info = (
					<>
						<Avatar name={name} image={member.memberImage} size={42} />
						<span className="pb-follow-row__text">
							<strong>{name}</strong>
							<small>{role}</small>
						</span>
					</>
				);
				const target = doctor ?? clinic;
				const like = doctor
					? { ...doctorLike, state: doctorLike.likeState(doctor._id, !!doctor.meLiked?.[0]?.myFavorite, doctor.doctorLikes) }
					: clinic
					? { ...clinicLike, state: clinicLike.likeState(clinic._id, !!clinic.meLiked?.[0]?.myFavorite, clinic.clinicLikes) }
					: null;
				const following = isFollowing(member._id);

				return (
					<div key={member._id} className="pb-follow-row">
						{href ? (
							<Link href={href} className="pb-follow-row__main">
								{info}
							</Link>
						) : (
							<span className="pb-follow-row__main">{info}</span>
						)}
						{isPro && user._id && member._id !== user._id && (
							<span className="pb-follow-row__acts">
								{target && like && (
									<button
										type="button"
										className={`pb-follow-row__like ${like.state.liked ? 'is-on' : ''}`}
										aria-pressed={like.state.liked}
										aria-label={like.state.liked ? `Unlike ${name}` : `Like ${name}`}
										onClick={() => like.toggleLike(target._id, like.state)}
									>
										<Icon name="heart" size={16} fill={like.state.liked} />
									</button>
								)}
								{canFollow(member._id) && (
									<button
										type="button"
										className={`pb-chip ${following ? 'pb-chip--following' : 'pb-chip--follow'}`}
										aria-pressed={following}
										onClick={() => toggleFollow(member._id)}
									>
										{following ? 'Following' : 'Follow'}
									</button>
								)}
							</span>
						)}
					</div>
				);
			})}
			{total > LIMIT && (
				<div className="pb-pagination">
					<Pagination page={page} count={Math.ceil(total / LIMIT)} onChange={(e, value) => setPage(value)} shape="circular" color="primary" size="small" />
				</div>
			)}
		</div>
	);
};

export default FollowList;
