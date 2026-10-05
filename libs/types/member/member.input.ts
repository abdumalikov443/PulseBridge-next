import { MemberStatus, MemberType } from '../../enums/member.enum';
import { Direction } from '../../enums/common.enum';
import { DoctorProfileInput } from '../doctor/doctor.input';
import { ClinicInput } from '../clinic/clinic.input';

export interface MemberInput {
	memberNick: string;
	memberPassword: string;
	memberPhone: string;
	memberType: MemberType;
	// only the profile that matches memberType
	doctorProfile?: DoctorProfileInput;
	clinicProfile?: ClinicInput;
}

export interface LoginInput {
	memberNick: string;
	memberPassword: string;
}

interface MISearch {
	memberStatus?: MemberStatus;
	memberType?: MemberType;
	text?: string;
}

export interface MembersInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: MISearch;
}
