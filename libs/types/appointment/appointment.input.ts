import { AppointmentStatus } from '../../enums/appointment.enum';
import { Direction } from '../../enums/common.enum';

export interface AppointmentInput {
	doctorId: string;
	appointmentDate: string; // YYYY-MM-DD
	appointmentTime: string; // HH:mm
	appointmentReason?: string;
}

interface APSearch {
	appointmentStatus?: AppointmentStatus;
	// clinic owner and admin can filter by doctor
	doctorId?: string;
}

export interface AppointmentsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: APSearch;
}
