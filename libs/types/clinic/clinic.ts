import { ClinicStatus, ClinicType } from '../../enums/clinic.enum';
import { Member } from '../member/member';
import { MeLiked, TotalCounter } from '../common';
import { MeFollowed } from '../follow/follow';

export interface Clinic {
	_id: string;
	clinicStatus: ClinicStatus;
	clinicType: ClinicType;
	clinicName: string;
	clinicAddress: string;
	clinicDesc: string;
	clinicImage?: string;
	clinicViews: number;
	clinicLikes: number;
	clinicComments: number;
	clinicDoctors: number;
	clinicFollowers: number;
	clinicRank: number;
	memberId: string;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	meFollowed?: MeFollowed[];
	memberData?: Member;
}

export interface Clinics {
	list: Clinic[];
	metaCounter: TotalCounter[];
}
