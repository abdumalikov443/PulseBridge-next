import { FollowGroup } from '../../enums/follow.enum';

// subscribe / unsubscribe target: doctors._id or clinics._id
export interface FollowInput {
	followGroup: FollowGroup;
	refId: string;
}

export interface FollowingsInquiry {
	page: number;
	limit: number;
	search: { followerId: string };
}

export interface FollowersInquiry {
	page: number;
	limit: number;
	search: FollowInput;
}
