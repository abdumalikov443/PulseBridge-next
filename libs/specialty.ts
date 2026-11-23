import { DoctorSpecialty } from './enums/doctor.enum';
import { IconName } from './components/ui/Icon';

// icon, color and a one-line description for every specialty (tiles, filter pills, tooltips)
export const SPECIALTY_INFO: Record<DoctorSpecialty, { icon: IconName; tone: string; desc: string }> = {
	[DoctorSpecialty.CARDIOLOGY]: { icon: 'heart', tone: 'pink', desc: 'Heart and blood pressure' },
	[DoctorSpecialty.DERMATOLOGY]: { icon: 'shield', tone: 'blue', desc: 'Skin, hair and nails' },
	[DoctorSpecialty.PEDIATRICS]: { icon: 'smile', tone: 'orange', desc: 'Children from birth to 18' },
	[DoctorSpecialty.NEUROLOGY]: { icon: 'brain', tone: 'violet', desc: 'Brain, nerves and headaches' },
	[DoctorSpecialty.DENTISTRY]: { icon: 'tooth', tone: 'sand', desc: 'Teeth and gums' },
	[DoctorSpecialty.UROLOGY]: { icon: 'droplet', tone: 'cyan', desc: 'Kidneys and bladder' },
	[DoctorSpecialty.ONCOLOGY]: { icon: 'ribbon', tone: 'rose', desc: 'Cancer care and screening' },
	[DoctorSpecialty.ORTHOPEDY]: { icon: 'bone', tone: 'slate', desc: 'Bones, joints and back' },
	[DoctorSpecialty.GASTROENTEROLOGY]: { icon: 'stomach', tone: 'lime', desc: 'Stomach and digestion' },
	[DoctorSpecialty.GENERAL]: { icon: 'stethoscope', tone: 'green', desc: 'First visit for any concern' },
};
