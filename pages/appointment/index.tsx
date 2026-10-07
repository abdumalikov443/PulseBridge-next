import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import moment from 'moment';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import Avatar from '../../libs/components/ui/Avatar';
import Icon from '../../libs/components/ui/Icon';
import { EcgLine } from '../../libs/components/ui/Loaders';
import { userVar } from '../../apollo/store';
import { GET_APPOINTMENT } from '../../apollo/user/query';
import { Appointment } from '../../libs/types/appointment/appointment';
import { AppointmentStatus } from '../../libs/enums/appointment.enum';
import { T } from '../../libs/types/common';
import { getMemberName } from '../../libs/config';
import { formatEnum } from '../../libs/utils';
import { downloadAppointmentPdf } from '../../libs/appointmentPdf';
import { sweetErrorHandling } from '../../libs/sweetAlert';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const tones: Record<AppointmentStatus, string> = {
	[AppointmentStatus.CONFIRMED]: 'success',
	[AppointmentStatus.COMPLETED]: 'soft',
	[AppointmentStatus.CANCELLED]: 'danger',
};

// confirmation page of one appointment: for its patient, doctor, clinic owner or ADMIN, with a PDF copy
const AppointmentPage: NextPage = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const appointmentId = router.query.id as string | undefined;
	const [appointment, setAppointment] = useState<Appointment | null>(null);
	const [failed, setFailed] = useState('');
	const [downloading, setDownloading] = useState(false);

	/** APOLLO REQUESTS **/
	useQuery(GET_APPOINTMENT, {
		fetchPolicy: 'network-only',
		skip: !appointmentId || !user?._id,
		variables: { appointmentId },
		onCompleted: (data: T) => setAppointment(data?.getAppointment ?? null),
		onError: (err) => setFailed(err.graphQLErrors?.[0]?.message ?? err.message),
	});

	/** HANDLERS **/
	const downloadHandler = async () => {
		if (!appointment) return;
		try {
			setDownloading(true);
			await downloadAppointmentPdf(appointment._id);
		} catch (err: any) {
			await sweetErrorHandling(err);
		} finally {
			setDownloading(false);
		}
	};

	if (!user?._id) {
		return (
			<div className="pb-container" style={{ padding: '48px 0' }}>
				<p className="pb-empty">
					Log in to see this appointment.{' '}
					<Link href={{ pathname: '/account/join', query: { referrer: router.asPath } }} className="pb-link">
						Log in
					</Link>
				</p>
			</div>
		);
	}

	if (failed) {
		return (
			<div className="pb-container" style={{ padding: '48px 0' }}>
				<p className="pb-empty">
					This appointment is not available to you.{' '}
					<Link href="/mypage?category=myAppointments" className="pb-link">
						My appointments
					</Link>
				</p>
			</div>
		);
	}

	if (!appointment) {
		return (
			<div className="pb-container" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
				<EcgLine />
			</div>
		);
	}

	const doctorName = getMemberName(appointment.doctorData?.memberData);
	const patientName = getMemberName(appointment.memberData);
	const day = moment.utc(appointment.appointmentDate);
	const cancelled = appointment.appointmentStatus === AppointmentStatus.CANCELLED;
	const mapsUrl = appointment.clinicData?.clinicAddress
		? `https://www.google.com/maps/search/${encodeURIComponent(appointment.clinicData.clinicAddress)}`
		: null;

	return (
		<div className="pb-container" style={{ maxWidth: 760 }}>
			<div style={{ padding: '24px 0 16px' }}>
				<Link
					href="/mypage?category=myAppointments"
					className="pb-link"
					style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
				>
					<Icon name="arrowLeft" size={16} /> My appointments
				</Link>
			</div>

			<article className="pb-ticket pb-in" aria-labelledby="ticket-title">
				<header className="pb-ticket__head">
					<span className={`pb-badge pb-badge--${tones[appointment.appointmentStatus]}`}>
						{formatEnum(appointment.appointmentStatus)}
					</span>
					<h1 id="ticket-title" className="pb-ticket__when">
						<span>{day.format('dddd, MMMM D, YYYY')}</span>
						<strong>{appointment.appointmentTime}</strong>
					</h1>
					<small>
						Seoul time · 30-minute visit · Booked {moment(appointment.createdAt).format('MMM D, YYYY HH:mm')}
					</small>
				</header>

				<div className="pb-ticket__rows">
					<div className="pb-ticket__row">
						<Avatar name={doctorName} image={appointment.doctorData?.memberData?.memberImage} size={48} />
						<span>
							<small>Doctor</small>
							<Link href={`/doctor/detail?id=${appointment.doctorId}`} className="pb-link">
								{doctorName}
							</Link>
							<em>
								{formatEnum(appointment.doctorData?.specialty)} · {appointment.doctorData?.experience ?? 0} years
							</em>
						</span>
					</div>
					<div className="pb-ticket__row">
						<span className="pb-ticket__icon">
							<Icon name="clinic" size={22} />
						</span>
						<span>
							<small>Clinic</small>
							<Link href={`/clinic/detail?id=${appointment.clinicId}`} className="pb-link">
								{appointment.clinicData?.clinicName}
							</Link>
							{mapsUrl && (
								<a href={mapsUrl} target="_blank" rel="noreferrer">
									<em>{appointment.clinicData?.clinicAddress}</em>
								</a>
							)}
						</span>
					</div>
					<div className="pb-ticket__row">
						<Avatar name={patientName} image={appointment.memberData?.memberImage} size={48} />
						<span>
							<small>Patient</small>
							<strong>{patientName}</strong>
							{appointment.memberData?.memberPhone && <em>{appointment.memberData.memberPhone}</em>}
						</span>
					</div>
					{appointment.appointmentReason && (
						<div className="pb-ticket__reason">
							<small>Reason for visit</small>
							<p>{appointment.appointmentReason}</p>
						</div>
					)}
				</div>

				<footer className="pb-ticket__foot">
					<small>Appointment no. {appointment._id}</small>
					{cancelled ? (
						<span className="pb-ticket__note">A cancelled appointment has no document.</span>
					) : (
						<button type="button" className="pb-btn pb-btn--primary" onClick={downloadHandler} disabled={downloading}>
							{downloading ? (
								<EcgLine small width={44} />
							) : (
								<>
									<Icon name="arrow" size={16} className="pb-ticket__down" /> Download PDF
								</>
							)}
						</button>
					)}
				</footer>
			</article>
		</div>
	);
};

export default withPbLayout(AppointmentPage);
