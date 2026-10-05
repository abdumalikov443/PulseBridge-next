import { ClinicStatus, ClinicType } from '../../enums/clinic.enum';
import { Direction } from '../../enums/common.enum';

// clinic profile sent with a CLINIC signup
export interface ClinicInput {
	clinicType: ClinicType;
	clinicName: string;
	clinicAddress: string;
	clinicDesc: string;
	clinicImage?: string;
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
