import React from 'react';
import { useMyFollowTarget } from '../../hooks/useMyFollowTarget';
import FollowList from '../common/FollowList';
import { SkeletonCards } from '../ui/Loaders';
import MySection from './MySection';

// followers of my doctor profile / clinic
const MyFollowers = () => {
	const target = useMyFollowTarget();

	return (
		<MySection title="Followers" subTitle="Members who follow your profile">
			{target ? <FollowList mode="followers" target={{ followGroup: target.followGroup, refId: target.refId }} /> : <SkeletonCards count={2} />}
		</MySection>
	);
};

export default MyFollowers;
