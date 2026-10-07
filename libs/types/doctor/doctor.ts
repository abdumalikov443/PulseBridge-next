import { DoctorSpecialty, JoinRequestStatus } from '../../enums/doctor.enum';
import { Member } from '../member/member';
import { Clinic } from '../clinic/clinic';
import { MeLiked, TotalCounter } from '../common';
import { MeFollowed } from '../follow/follow';

export interface Doctor {
	_id: string;
	memberId: string;
	// null while the doctor does not work in any clinic
	clinicId?: string | null;
	specialty: DoctorSpecialty;
	experience: number;
	doctorViews: number;
	doctorLikes: number;
	doctorComments: number;
	doctorFollowers: number;
	doctorRank: number;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	meLiked?: MeLiked[];
	meFollowed?: MeFollowed[];
	memberData?: Member;
	clinicData?: Clinic;
}

export interface Doctors {
	list: Doctor[];
	metaCounter: TotalCounter[];
}

export interface ClinicJoinRequest {
	_id: string;
	doctorId: string;
	clinicId: string;
	requestStatus: JoinRequestStatus;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	doctorData?: Doctor;
	clinicData?: Clinic;
}

export interface ClinicJoinRequests {
	list: ClinicJoinRequest[];
	metaCounter: TotalCounter[];
}
