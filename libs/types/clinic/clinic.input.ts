import { ClinicStatus, ClinicType, WeekDay } from '../../enums/clinic.enum';
import { Direction } from '../../enums/common.enum';

// clinic profile sent with a CLINIC signup
export interface ClinicInput {
	clinicType: ClinicType;
	clinicName: string;
	clinicAddress: string;
	clinicDesc: string;
	clinicImage?: string;
	// working hours "HH:mm" on half hours (Seoul time)
	clinicOpenTime?: string;
	clinicCloseTime?: string;
	clinicBreakStart?: string | null;
	clinicBreakEnd?: string | null;
	clinicOffDays?: WeekDay[];
}

interface CLISearch {
	clinicType?: ClinicType;
	text?: string;
}

export interface ClinicsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: CLISearch;
}

interface ACLISearch {
	clinicType?: ClinicType;
	clinicStatus?: ClinicStatus;
	text?: string;
}

export interface AllClinicsInquiry {
	page: number;
	limit: number;
	sort?: string;
	direction?: Direction;
	search: ACLISearch;
}
