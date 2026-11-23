import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import moment from 'moment';
import { Pagination } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { Appointment } from '../../types/appointment/appointment';
import { AppointmentsInquiry } from '../../types/appointment/appointment.input';
import { AppointmentStatus } from '../../enums/appointment.enum';
import { MemberType } from '../../enums/member.enum';
import { Direction } from '../../enums/common.enum';
import { T } from '../../types/common';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import { UPDATE_APPOINTMENT } from '../../../apollo/user/mutation';
import {
	GET_CLINIC_APPOINTMENTS,
	GET_DOCTOR_APPOINTMENTS,
	GET_MY_APPOINTMENTS,
	GET_MY_DOCTOR_PROFILE,
} from '../../../apollo/user/query';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import { downloadAppointmentPdf } from '../../appointmentPdf';
import ListRow, { Tone } from './ListRow';
import MySection from './MySection';
import Avatar from '../ui/Avatar';
import { SkeletonCards } from '../ui/Loaders';

const statusTabs = [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED];
const tones: Record<AppointmentStatus, Tone> = {
	[AppointmentStatus.CONFIRMED]: 'soft',
	[AppointmentStatus.COMPLETED]: 'success',
	[AppointmentStatus.CANCELLED]: 'danger',
};

// patient: own bookings; doctor: bookings with me; clinic: bookings of my clinic
const getAppointmentsQuery = (memberType: string) => {
	if (memberType === MemberType.DOCTOR) return { query: GET_DOCTOR_APPOINTMENTS, key: 'getDoctorAppointments' };
	if (memberType === MemberType.CLINIC) return { query: GET_CLINIC_APPOINTMENTS, key: 'getClinicAppointments' };
	return { query: GET_MY_APPOINTMENTS, key: 'getMyAppointments' };
};

interface MyAppointmentsProps {
	// overview shows the next confirmed visits only
	compact?: boolean;
}

const EMPTY_TEXT: Partial<Record<AppointmentStatus, string>> = {
	[AppointmentStatus.CONFIRMED]: 'No confirmed appointments.',
	[AppointmentStatus.COMPLETED]: 'No completed appointments.',
	[AppointmentStatus.CANCELLED]: 'No cancelled appointments.',
};

const MyAppointments = ({ compact = false }: MyAppointmentsProps) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const isPatient = user.memberType === MemberType.PATIENT;
	const isDoctor = user.memberType === MemberType.DOCTOR;
	const { query, key } = getAppointmentsQuery(user.memberType);
	const [input, setInput] = useState<AppointmentsInquiry>({
		page: 1,
		limit: compact ? 3 : 6,
		sort: 'appointmentDate',
		direction: Direction.ASC,
		search: { appointmentStatus: AppointmentStatus.CONFIRMED },
	});
	const [appointments, setAppointments] = useState<Appointment[] | null>(null);
	const [total, setTotal] = useState(0);
	// a doctor without a clinic has no appointments to manage
	const [doctorHasClinic, setDoctorHasClinic] = useState<boolean | null>(isDoctor ? null : true);

	/** APOLLO REQUESTS **/
	const [updateAppointment] = useMutation(UPDATE_APPOINTMENT);

	useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'network-only',
		skip: !isDoctor,
		onCompleted: (data: T) => setDoctorHasClinic(!!data?.getMyDoctorProfile?.clinicId),
	});

	const { refetch } = useQuery(query, {
		fetchPolicy: 'network-only',
		variables: { input },
		skip: !user._id || !doctorHasClinic,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setAppointments(data?.[key]?.list ?? []);
			setTotal(data?.[key]?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setAppointments([]),
	});

	/** HANDLERS **/
	const updateStatusHandler = async (id: string, status: AppointmentStatus.COMPLETED | AppointmentStatus.CANCELLED) => {
		try {
			const question =
				status === AppointmentStatus.COMPLETED
					? 'Do you want to complete this appointment?'
					: 'Do you want to cancel this appointment?';
			if (!(await sweetConfirmAlert(question))) return;
			await updateAppointment({ variables: { input: { _id: id, appointmentStatus: status } } });
			await refetch({ input });
			await sweetTopSmallSuccessAlert('Done', 800);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const pdfHandler = async (id: string) => {
		try {
			await downloadAppointmentPdf(id);
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	const status = input.search.appointmentStatus as AppointmentStatus;
	const title = compact ? 'Upcoming visits' : 'Appointments';

	if (doctorHasClinic === false) {
		return (
			<MySection title={title}>
				<p className="pb-empty">
					{t('Join a clinic first: patients can book you after a clinic approves your request.')}{' '}
					<Link href="/mypage?category=joinRequests" className="pb-link">
						{t('Join requests')}
					</Link>
				</p>
			</MySection>
		);
	}

	return (
		<MySection
			title={title}
			subTitle={compact ? undefined : isPatient ? 'Your bookings with doctors' : 'Bookings made by patients'}
			actions={
				compact ? (
					<Link href="/mypage?category=myAppointments" className="pb-btn pb-btn--light pb-btn--sm">
						{t('All appointments')}
					</Link>
				) : undefined
			}
		>
			{!compact && (
				<div className="pb-pills" role="tablist" aria-label={t('Status')}>
					{statusTabs.map((tab) => (
						<button
							key={tab}
							type="button"
							role="tab"
							aria-selected={status === tab}
							className={`pb-pill ${status === tab ? 'pb-pill--active' : ''}`}
							onClick={() => setInput({ ...input, page: 1, search: { ...input.search, appointmentStatus: tab } })}
						>
							{formatEnum(tab)}
						</button>
					))}
				</div>
			)}

			{appointments === null && <SkeletonCards count={compact ? 2 : 3} />}
			{appointments?.length === 0 && (
				<p className="pb-empty">
					{t(EMPTY_TEXT[status] ?? 'No appointments.')}{' '}
					{isPatient && (
						<Link href="/doctor" className="pb-link">
							{t('Find a doctor')}
						</Link>
					)}
				</p>
			)}
			{appointments?.map((appointment) => {
				const person = isPatient ? appointment.doctorData?.memberData : appointment.memberData;
				const doctorLine = isPatient
					? formatEnum(appointment.doctorData?.specialty)
					: `${t('Dr.')} ${getMemberName(appointment.doctorData?.memberData)}`;
				const confirmed = appointment.appointmentStatus === AppointmentStatus.CONFIRMED;
				return (
					<ListRow
						key={appointment._id}
						avatar={<Avatar name={getMemberName(person)} image={person?.memberImage} size={46} />}
						title={getMemberName(person)}
						subTitle={`${doctorLine} · ${appointment.clinicData?.clinicName ?? ''}`}
						extra={appointment.appointmentReason}
						dateText={`${moment.utc(appointment.appointmentDate).format('ddd, MMM D')} · ${
							appointment.appointmentTime
						}`}
						status={formatEnum(appointment.appointmentStatus)}
						tone={tones[appointment.appointmentStatus]}
						onClick={() => router.push(`/appointment?id=${appointment._id}`)}
						actions={
							<>
								{appointment.appointmentStatus !== AppointmentStatus.CANCELLED && (
									<button
										type="button"
										className="pb-btn pb-btn--light pb-btn--sm"
										onClick={() => pdfHandler(appointment._id)}
										aria-label={t('Download PDF')}
									>
										PDF
									</button>
								)}
								{confirmed && (
									<>
										{!isPatient && (
											<button
												type="button"
												className="pb-btn pb-btn--primary pb-btn--sm"
												onClick={() => updateStatusHandler(appointment._id, AppointmentStatus.COMPLETED)}
											>
												{t('Complete')}
											</button>
										)}
										<button
											type="button"
											className="pb-btn pb-btn--danger pb-btn--sm"
											onClick={() => updateStatusHandler(appointment._id, AppointmentStatus.CANCELLED)}
										>
											{t('Cancel')}
										</button>
									</>
								)}
							</>
						}
					/>
				);
			})}

			{!compact && total > input.limit && (
				<div className="pb-pagination">
					<Pagination
						page={input.page}
						count={Math.ceil(total / input.limit)}
						onChange={(e, page) => setInput({ ...input, page })}
						shape="circular"
						color="primary"
					/>
				</div>
			)}
		</MySection>
	);
};

export default MyAppointments;
