import React from 'react';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { Appointment } from '../../types/appointment/appointment';
import { AppointmentStatus } from '../../enums/appointment.enum';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import { dayLabel } from '../../schedule';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { Tone } from './ListRow';

const tones: Record<AppointmentStatus, Tone> = {
	[AppointmentStatus.CONFIRMED]: 'soft',
	[AppointmentStatus.COMPLETED]: 'success',
	[AppointmentStatus.CANCELLED]: 'danger',
};

interface AppointmentRowProps {
	appointment: Appointment;
	// patients see the doctor; doctors and clinics see the patient
	isPatient: boolean;
	// the first upcoming visit on the overview: larger, with a "Next visit" label
	featured?: boolean;
	showStatus?: boolean;
	onOpen: () => void;
	onPdf: () => void;
	onComplete?: () => void;
	onCancel?: () => void;
}

// one visit: date tile, who and where, the visit reason, then time, status and actions
const AppointmentRow = (props: AppointmentRowProps) => {
	const { appointment, isPatient, featured, showStatus = true, onOpen, onPdf, onComplete, onCancel } = props;
	const { t } = useTranslation('common');
	// appointment days are stored at UTC midnight
	const day = moment.utc(appointment.appointmentDate);
	const person = isPatient ? appointment.doctorData?.memberData : appointment.memberData;
	const name = isPatient ? `${t('Dr.')} ${getMemberName(person)}` : getMemberName(person);
	const line = isPatient
		? `${formatEnum(appointment.doctorData?.specialty)} · ${appointment.clinicData?.clinicName ?? ''}`
		: `${t('Dr.')} ${getMemberName(appointment.doctorData?.memberData)} · ${appointment.clinicData?.clinicName ?? ''}`;
	const status = appointment.appointmentStatus;

	return (
		<article className={`pb-visit ${featured ? 'pb-visit--next' : ''} pb-visit--${status.toLowerCase()}`}>
			<button type="button" className="pb-visit__date" onClick={onOpen} aria-label={t('Open appointment')}>
				<small>{day.format('ddd')}</small>
				<strong>{day.format('D')}</strong>
				<small>{day.format('MMM')}</small>
			</button>

			<button type="button" className="pb-visit__main" onClick={onOpen}>
				{featured && (
					<span className="pb-visit__label">
						{t('Next visit')} · {dayLabel(day.format('YYYY-MM-DD'))}
					</span>
				)}
				<span className="pb-visit__who">
					<Avatar name={getMemberName(person)} image={person?.memberImage} size={featured ? 44 : 38} />
					<span>
						<strong>{name}</strong>
						<small>{line}</small>
					</span>
				</span>
				{appointment.appointmentReason && <span className="pb-visit__reason">{appointment.appointmentReason}</span>}
			</button>

			<div className="pb-visit__side">
				<span className="pb-visit__time">
					<Icon name="clock" size={16} />
					{appointment.appointmentTime}
				</span>
				{showStatus && <span className={`pb-badge pb-badge--${tones[status]}`}>{formatEnum(status)}</span>}
				<div className="pb-visit__actions">
					{status !== AppointmentStatus.CANCELLED && (
						<button type="button" className="pb-icon-btn pb-visit__icon" onClick={onPdf} title={t('Download PDF')}>
							<Icon name="download" size={18} />
							<span className="pb-sr">{t('Download PDF')}</span>
						</button>
					)}
					{onComplete && (
						<button type="button" className="pb-btn pb-btn--primary pb-btn--sm" onClick={onComplete}>
							<Icon name="check" size={14} />
							{t('Complete')}
						</button>
					)}
					{onCancel && (
						<button type="button" className="pb-visit__cancel" onClick={onCancel}>
							{t('Cancel')}
						</button>
					)}
				</div>
			</div>
		</article>
	);
};

export default AppointmentRow;
