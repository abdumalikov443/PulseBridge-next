import { ClinicStatus, ClinicType, WeekDay } from '../../enums/clinic.enum';

export interface ClinicUpdate {
	_id: string;
	clinicStatus?: ClinicStatus;
	clinicType?: ClinicType;
	clinicName?: string;
	clinicAddress?: string;
	clinicDesc?: string;
	clinicImage?: string;
	// working hours "HH:mm" on half hours (Seoul time)
	clinicOpenTime?: string;
	clinicCloseTime?: string;
	clinicBreakStart?: string | null;
	clinicBreakEnd?: string | null;
	clinicOffDays?: WeekDay[];
}
