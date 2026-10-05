import { DoctorSpecialty } from '../../enums/doctor.enum';

export interface DoctorUpdate {
	_id: string;
	specialty?: DoctorSpecialty;
	experience?: number;
}
