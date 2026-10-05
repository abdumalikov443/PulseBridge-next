import { ClinicStatus, ClinicType } from '../../enums/clinic.enum';
import { Member } from '../member/member';
import { MeLiked, TotalCounter } from '../common';

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
	clinicRank: number;
	memberId: string;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	memberData?: Member;
}

export interface Clinics {
	list: Clinic[];
	metaCounter: TotalCounter[];
}
