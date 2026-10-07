import { useCallback, useState } from 'react';
import { DocumentNode, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';
import { GET_MEMBER_FOLLOWINGS } from '../../apollo/user/query';
import { SUBSCRIBE, UNSUBSCRIBE } from '../../apollo/user/mutation';
import { Messages } from '../config';
import { sweetMixinErrorAlert } from '../sweetAlert';
import { T } from '../types/common';
import { FollowGroup } from '../enums/follow.enum';

// doctors and clinics I follow (ids of the doctor / clinic, not of their members)
export const useFollowing = () => {
	const user = useReactiveVar(userVar);
	const [following, setFollowing] = useState<Set<string>>(new Set());
	const [subscribe] = useMutation(SUBSCRIBE);
	const [unsubscribe] = useMutation(UNSUBSCRIBE);

	useQuery(GET_MEMBER_FOLLOWINGS, {
		fetchPolicy: 'cache-and-network',
		skip: !user?._id,
		variables: { input: { page: 1, limit: 200, search: { followerId: user?._id } } },
		onCompleted: (data: T) => {
			const ids = (data?.getMemberFollowings?.list ?? []).map((ele: T) => ele.followRefId);
			setFollowing(new Set(ids));
		},
	});

	const isFollowing = useCallback((refId?: string) => !!refId && following.has(refId), [following]);

	// nobody follows their own doctor profile or clinic
	const canFollow = useCallback((ownerMemberId?: string) => !!ownerMemberId && ownerMemberId !== user?._id, [user?._id]);

	const toggleFollow = useCallback(
		async (followGroup: FollowGroup, refId?: string) => {
			try {
				if (!refId) return;
				if (!user?._id) throw new Error(Messages.error2);
				const on = following.has(refId);
				const next = new Set(following);
				if (on) next.delete(refId);
				else next.add(refId);
				setFollowing(next);
				const input = { followGroup, refId };
				if (on) await unsubscribe({ variables: { input } });
				else await subscribe({ variables: { input } });
			} catch (err: any) {
				sweetMixinErrorAlert(err.message).then();
			}
		},
		[following, user?._id, subscribe, unsubscribe],
	);

	return { isFollowing, canFollow, toggleFollow };
};

interface LikeState {
	liked: boolean;
	likes: number;
}

// optimistic like toggle for any likeTarget* mutation (clinic, doctor, article)
export const useLikeToggle = (mutation: DocumentNode) => {
	const user = useReactiveVar(userVar);
	const [likeTarget] = useMutation(mutation);
	const [overrides, setOverrides] = useState<Record<string, LikeState>>({});

	const likeState = useCallback(
		(id: string, liked: boolean, likes: number): LikeState => overrides[id] ?? { liked, likes },
		[overrides],
	);

	const toggleLike = useCallback(
		async (id: string, current: LikeState) => {
			try {
				if (!user?._id) throw new Error(Messages.error2);
				const next = { liked: !current.liked, likes: current.likes + (current.liked ? -1 : 1) };
				setOverrides((prev) => ({ ...prev, [id]: next }));
				await likeTarget({ variables: { input: id } });
			} catch (err: any) {
				setOverrides((prev) => ({ ...prev, [id]: current }));
				sweetMixinErrorAlert(err.message).then();
			}
		},
		[user?._id, likeTarget],
	);

	return { likeState, toggleLike };
};
