import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Pagination } from '@mui/material';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_FOLLOWERS, GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';
import { LIKE_TARGET_CLINIC, LIKE_TARGET_DOCTOR } from '../../../apollo/user/mutation';
import { useFollowing, useLikeToggle } from '../../hooks/useEngagement';
import { usePublicTargets } from '../../hooks/usePublicTargets';
import { Follow } from '../../types/follow/follow';
import { Doctor } from '../../types/doctor/doctor';
import { Clinic } from '../../types/clinic/clinic';
import { FollowGroup } from '../../enums/follow.enum';
import { MemberType } from '../../enums/member.enum';
import { T } from '../../types/common';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { SkeletonCards } from '../ui/Loaders';

export interface FollowTarget {
	followGroup: FollowGroup;
	refId: string;
}

interface FollowListProps {
	// followers of a doctor / clinic, or what a member follows
	mode: 'followers' | 'followings';
	target?: FollowTarget;
	memberId?: string;
}

interface Row {
	key: string;
	name: string;
	image?: string | null;
	role: string;
	href: string | null;
	// set for doctors and clinics: like and follow work on their own id
	target?: { group: FollowGroup; id: string; ownerId: string };
}

const LIMIT = 10;
const FollowList = ({ mode, target, memberId }: FollowListProps) => {
	const user = useReactiveVar(userVar);
	const [page, setPage] = useState(1);
	const [items, setItems] = useState<Follow[] | null>(null);
	const [total, setTotal] = useState(0);
	const { isFollowing, canFollow, toggleFollow } = useFollowing();
	const doctorLike = useLikeToggle(LIKE_TARGET_DOCTOR);
	const clinicLike = useLikeToggle(LIKE_TARGET_CLINIC);
	const { doctors, clinics } = usePublicTargets();
	const isFollowers = mode === 'followers';
	const key = isFollowers ? 'getFollowers' : 'getMemberFollowings';

	/** APOLLO REQUESTS **/
	useQuery(isFollowers ? GET_FOLLOWERS : GET_MEMBER_FOLLOWINGS, {
		fetchPolicy: 'network-only',
		skip: isFollowers ? !target?.refId : !memberId,
		variables: {
			input: { page, limit: LIMIT, search: isFollowers ? { followGroup: target?.followGroup, refId: target?.refId } : { followerId: memberId } },
		},
		onCompleted: (data: T) => {
			setItems(data?.[key]?.list ?? []);
			setTotal(data?.[key]?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setItems([]),
	});

	const rows: Row[] = useMemo(() => {
		const doctorById = new Map(doctors.map((ele) => [ele._id, ele]));
		const doctorByMember = new Map(doctors.map((ele) => [ele.memberId, ele]));
		const clinicByMember = new Map(clinics.map((ele) => [ele.memberId, ele]));
		const doctorRow = (doctor: Doctor): Row => ({
			key: doctor._id,
			name: getMemberName(doctor.memberData),
			image: doctor.memberData?.memberImage,
			role: `Doctor · ${formatEnum(doctor.specialty)}`,
			href: `/doctor/detail?id=${doctor._id}`,
			target: { group: FollowGroup.DOCTOR, id: doctor._id, ownerId: doctor.memberId },
		});
		const clinicRow = (clinic: Clinic): Row => ({
			key: clinic._id,
			name: clinic.clinicName,
			image: clinic.clinicImage,
			role: `Clinic · ${formatEnum(clinic.clinicType)}`,
			href: `/clinic/detail?id=${clinic._id}`,
			target: { group: FollowGroup.CLINIC, id: clinic._id, ownerId: clinic.memberId },
		});

		return (items ?? []).flatMap((item): Row[] => {
			if (!isFollowers) {
				if (item.doctorData) return [doctorRow(doctorById.get(item.doctorData._id) ?? item.doctorData)];
				if (item.clinicData) return [clinicRow(item.clinicData)];
				return [];
			}
			const member = item.followerData;
			if (!member) return [];
			// a follower who owns a public doctor profile or clinic shows it; patients are plain rows
			const doctor = member.memberType === MemberType.DOCTOR ? doctorByMember.get(member._id) : undefined;
			const clinic = member.memberType === MemberType.CLINIC ? clinicByMember.get(member._id) : undefined;
			if (doctor) return [doctorRow(doctor)];
			if (clinic) return [clinicRow(clinic)];
			return [{ key: member._id, name: getMemberName(member), image: member.memberImage, role: formatEnum(member.memberType), href: null }];
		});
	}, [items, doctors, clinics, isFollowers]);

	const likeOf = (row: Row) => {
		if (!row.target) return null;
		if (row.target.group === FollowGroup.DOCTOR) {
			const doctor = doctors.find((ele) => ele._id === row.target?.id);
			return { hook: doctorLike, state: doctorLike.likeState(row.target.id, !!doctor?.meLiked?.[0]?.myFavorite, doctor?.doctorLikes ?? 0) };
		}
		const clinic = clinics.find((ele) => ele._id === row.target?.id);
		return { hook: clinicLike, state: clinicLike.likeState(row.target.id, !!clinic?.meLiked?.[0]?.myFavorite, clinic?.clinicLikes ?? 0) };
	};

	return (
		<div className="pb-follow-list">
			{items === null && <SkeletonCards count={3} />}
			{items?.length === 0 && <p className="pb-empty">{isFollowers ? 'No followers yet.' : 'Not following any doctor or clinic yet.'}</p>}
			{rows.map((row) => {
				const info = (
					<>
						<Avatar name={row.name} image={row.image} size={42} radius={row.target?.group === FollowGroup.CLINIC ? 12 : '50%'} />
						<span className="pb-follow-row__text">
							<strong>{row.name}</strong>
							<small>{row.role}</small>
						</span>
					</>
				);
				const like = likeOf(row);
				const following = row.target ? isFollowing(row.target.id) : false;

				return (
					<div key={row.key} className="pb-follow-row">
						{row.href ? (
							<Link href={row.href} className="pb-follow-row__main">
								{info}
							</Link>
						) : (
							<span className="pb-follow-row__main">{info}</span>
						)}
						{row.target && user._id && canFollow(row.target.ownerId) && (
							<span className="pb-follow-row__acts">
								{like && (
									<button
										type="button"
										className={`pb-follow-row__like ${like.state.liked ? 'is-on' : ''}`}
										aria-pressed={like.state.liked}
										aria-label={like.state.liked ? `Unlike ${row.name}` : `Like ${row.name}`}
										onClick={() => row.target && like.hook.toggleLike(row.target.id, like.state)}
									>
										<Icon name="heart" size={16} fill={like.state.liked} />
									</button>
								)}
								<button
									type="button"
									className={`pb-chip ${following ? 'pb-chip--following' : 'pb-chip--follow'}`}
									aria-pressed={following}
									onClick={() => row.target && toggleFollow(row.target.group, row.target.id)}
								>
									{following ? 'Following' : 'Follow'}
								</button>
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
