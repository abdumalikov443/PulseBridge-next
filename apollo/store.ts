import { makeVar } from '@apollo/client';

import { CustomJwtPayload } from '../libs/types/customJwtPayload';
export const themeVar = makeVar({});

export const initialUser: CustomJwtPayload = {
	_id: '',
	memberType: '',
	memberStatus: '',
	memberPhone: '',
	memberNick: '',
	memberFullName: '',
	memberImage: '',
	memberAddress: '',
	memberDesc: '',
	memberArticles: 0,
	memberFollowers: 0,
	memberFollowings: 0,
	memberPoints: 0,
	memberLikes: 0,
	memberViews: 0,
	memberComments: 0,
	memberRank: 0,
};

export const userVar = makeVar<CustomJwtPayload>(initialUser);

// @ts-ignore
export const socketVar = makeVar<WebSocket>();
