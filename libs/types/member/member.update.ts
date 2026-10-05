import { MemberStatus } from '../../enums/member.enum';

// memberType is never changed after signup
export interface MemberUpdate {
	_id: string;
	memberPhone?: string;
	memberNick?: string;
	memberPassword?: string;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
}

// memberStatus is changed only by admin
export interface AdminMemberUpdate {
	_id: string;
	memberStatus?: MemberStatus;
	memberPhone?: string;
	memberNick?: string;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
}
