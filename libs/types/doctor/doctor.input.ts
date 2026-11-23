import { DoctorSpecialty, JoinRequestStatus } from '../../enums/doctor.enum';
import { Direction } from '../../enums/common.enum';

// doctor profile sent with a DOCTOR signup
export interface DoctorProfileInput {
	specialty: DoctorSpecialty;
	experience: number;
}

// clinic owner approves or rejects a join request
export interface JoinRequestUpdate {
	_id: string;
	requestStatus: JoinRequestStatus.APPROVED | JoinRequestStatus.REJECTED;
}

interface DOSearch {
	clinicId?: string;
	specialtyList?: DoctorSpecialty[];
	text?: string;
}

export interface DoctorsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: DOSearch;
}
