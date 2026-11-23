import { AppointmentStatus } from '../../enums/appointment.enum';

export interface AppointmentUpdate {
	_id: string;
	appointmentStatus: AppointmentStatus.COMPLETED | AppointmentStatus.CANCELLED;
}
