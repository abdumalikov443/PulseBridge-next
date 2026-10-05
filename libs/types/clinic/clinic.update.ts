import { ClinicStatus, ClinicType } from '../../enums/clinic.enum';

export interface ClinicUpdate {
	_id: string;
	clinicStatus?: ClinicStatus;
	clinicType?: ClinicType;
	clinicName?: string;
	clinicAddress?: string;
	clinicDesc?: string;
	clinicImage?: string;
}
