import React, { useState } from 'react';
import Link from 'next/link';
import { Pagination } from '@mui/material';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_MEMBER_FOLLOWERS, GET_MEMBER_FOLLOWINGS } from '../../../apollo/user/query';
import { useFollowing } from '../../hooks/useEngagement';
import { Member } from '../../types/member/member';
import { T } from '../../types/common';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import Avatar from '../ui/Avatar';
import { formatCount } from '../ui/ActionChips';
import { SkeletonCards } from '../ui/Loaders';

interface FollowListProps {
	mode: 'followers' | 'followings';
	memberId: string;
}

const LIMIT = 10;

// followers or followings of a member, with follow buttons for the viewer
const FollowList = ({ mode, memberId }: FollowListProps) => {
	const user = useReactiveVar(userVar);
	const [page, setPage] = useState(1);
	const [members, setMembers] = useState<Member[] | null>(null);
	const [total, setTotal] = useState(0);
	const { isFollowing, canFollow, toggleFollow } = useFollowing();
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

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
			{members === null && <SkeletonCards count={3} />}
			{members?.length === 0 && <p className="pb-empty">{isFollowers ? 'No followers yet.' : 'Not following anyone yet.'}</p>}
			{members?.map((member) => {
				const href = member._id === user._id ? '/mypage' : `/member?memberId=${member._id}`;
				const following = isFollowing(member._id);
				return (
					<article key={member._id} className="pb-row">
						<Link href={href} className="pb-row__main">
							<Avatar name={getMemberName(member)} image={member.memberImage} size={46} />
							<span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
								<strong style={{ fontSize: 15 }}>{getMemberName(member)}</strong>
								<span style={{ fontSize: 13, color: 'var(--pb-muted)' }}>
									{formatEnum(member.memberType)} · {formatCount(member.memberFollowers ?? 0)} followers · {member.memberArticles} articles
								</span>
							</span>
						</Link>
						{user._id && canFollow(member._id) && (
							<button
								type="button"
								className={`pb-chip ${following ? 'pb-chip--following' : 'pb-chip--follow'}`}
								aria-pressed={following}
								onClick={() => toggleFollow(member._id)}
							>
								{following ? 'Following' : 'Follow'}
							</button>
						)}
					</article>
				);
			})}
			{total > LIMIT && (
				<div className="pb-pagination">
					<Pagination page={page} count={Math.ceil(total / LIMIT)} onChange={(e, value) => setPage(value)} shape="circular" color="primary" />
				</div>
			)}
		</div>
	);
};

export default FollowList;
