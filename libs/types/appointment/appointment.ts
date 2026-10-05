import { AppointmentStatus } from '../../enums/appointment.enum';
import { Member } from '../member/member';
import { Doctor } from '../doctor/doctor';
import { Clinic } from '../clinic/clinic';
import { TotalCounter } from '../common';

export interface Appointment {
	_id: string;
	appointmentDate: Date;
	appointmentTime: string;
	appointmentStatus: AppointmentStatus;
	appointmentReason?: string;
	memberId: string;
	doctorId: string;
	clinicId: string;
	createdAt: Date;
	updatedAt: Date;
	/** from aggregation **/
	memberData?: Member;
	doctorData?: Doctor;
	clinicData?: Clinic;
}

export interface Appointments {
	list: Appointment[];
	metaCounter: TotalCounter[];
}
