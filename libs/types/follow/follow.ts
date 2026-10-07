import { TotalCounter } from '../common';
import { Member } from '../member/member';
import { Doctor } from '../doctor/doctor';
import { Clinic } from '../clinic/clinic';
import { FollowGroup } from '../../enums/follow.enum';

export interface MeFollowed {
	followerId: string;
	followRefId: string;
	myFollowing: boolean;
}

// a member follows a doctor profile or a clinic
export interface Follow {
	_id: string;
	followerId: string;
	followGroup: FollowGroup;
	followRefId: string;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meFollowed?: MeFollowed[];
	followerData?: Member;
	doctorData?: Doctor;
	clinicData?: Clinic;
}

export interface Follows {
	list: Follow[];
	metaCounter: TotalCounter[];
}
