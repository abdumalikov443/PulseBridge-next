import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_CLINIC_APPOINTMENTS, GET_DOCTOR_APPOINTMENTS, GET_MY_APPOINTMENTS } from '../../../apollo/user/query';
import { AppointmentStatus } from '../../enums/appointment.enum';
import { MemberType } from '../../enums/member.enum';
import { Appointment } from '../../types/appointment/appointment';
import { getMemberName } from '../../config';
import Icon from '../ui/Icon';

const DISMISSED_KEY = 'pb_reminder_dismissed';
// one request per member for a few minutes, not one per page change
const TTL = 5 * 60 * 1000;
let cache: { key: string; at: number; promise: Promise<Appointment | null> } | null = null;

// appointments are Seoul calendar days with a "HH:mm" time; this is the real start time
const startOf = (appointment: Appointment): number => {
	const day = new Date(appointment.appointmentDate);
	const [h, m] = appointment.appointmentTime.split(':').map(Number);
	return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h - 9, m);
};
const seoulDay = (time: number) => new Date(time + 9 * 3600000).toISOString().slice(0, 10);

const queryFor = (memberType: string) =>
	memberType === MemberType.DOCTOR
		? { query: GET_DOCTOR_APPOINTMENTS, key: 'getDoctorAppointments' }
		: memberType === MemberType.CLINIC
		? { query: GET_CLINIC_APPOINTMENTS, key: 'getClinicAppointments' }
		: { query: GET_MY_APPOINTMENTS, key: 'getMyAppointments' };

// reminder above the page for a confirmed visit today or tomorrow (Seoul time):
// the patient sees the doctor and the clinic, a doctor or a clinic sees the patient
const AppointmentReminder = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const client = useApolloClient();
	const [next, setNext] = useState<Appointment | null>(null);
	const [dismissed, setDismissed] = useState<string | null>(null);
	const role = user?.memberType;
	const enabled =
		!!user?._id && (role === MemberType.PATIENT || role === MemberType.DOCTOR || role === MemberType.CLINIC);

	useEffect(() => {
		try {
			setDismissed(localStorage.getItem(DISMISSED_KEY));
		} catch {}
	}, []);

	useEffect(() => {
		if (!enabled) return setNext(null);
		const key = `${user._id}:${role}`;
		if (!cache || cache.key !== key || Date.now() - cache.at > TTL) {
			const { query, key: resultKey } = queryFor(role);
			const promise = client
				.query({
					query,
					fetchPolicy: 'network-only',
					variables: {
						input: {
							page: 1,
							limit: 10,
							sort: 'appointmentDate',
							direction: 'ASC',
							search: { appointmentStatus: AppointmentStatus.CONFIRMED },
						},
					},
				})
				.then((res) => {
					const list: Appointment[] = res.data?.[resultKey]?.list ?? [];
					// the first confirmed visit that has not started yet
					return list.find((ele) => startOf(ele) > Date.now()) ?? null;
				});
			promise.catch(() => {
				if (cache?.promise === promise) cache = null;
			});
			cache = { key, at: Date.now(), promise };
		}
		let active = true;
		cache.promise.then((value) => active && setNext(value)).catch(() => active && setNext(null));
		return () => {
			active = false;
		};
	}, [enabled, user._id, role, client, router.asPath]);

	if (!next || dismissed === next._id) return null;
	// the home hero already shows the next visit, and the appointment page is the visit itself
	if (router.pathname === '/' || router.pathname === '/appointment') return null;

	const start = startOf(next);
	const today = seoulDay(Date.now());
	const tomorrow = seoulDay(Date.now() + 86400000);
	const day = seoulDay(start);
	if (day !== today && day !== tomorrow) return null;

	const when =
		day === today
			? t('today at {{time}}', { time: next.appointmentTime })
			: t('tomorrow at {{time}}', { time: next.appointmentTime });
	const doctor = getMemberName(next.doctorData?.memberData);
	const text =
		role === MemberType.PATIENT
			? t('Your visit with {{doctor}} is {{when}}', { doctor: `${t('Dr.')} ${doctor}`, when })
			: role === MemberType.CLINIC
			? t('{{patient}} has a visit with {{doctor}} {{when}}', {
					patient: getMemberName(next.memberData),
					doctor: `${t('Dr.')} ${doctor}`,
					when,
			  })
			: t('Next patient {{patient}} {{when}}', { patient: getMemberName(next.memberData), when });

	const dismiss = () => {
		setDismissed(next._id);
		try {
			localStorage.setItem(DISMISSED_KEY, next._id);
		} catch {}
	};

	return (
		<div className="pb-container">
			<div className={`pb-reminder ${day === today ? 'is-today' : ''}`} role="status">
				<span className="pb-reminder__icon">
					<Icon name="bell" size={18} />
				</span>
				<span className="pb-reminder__text">
					<strong>{t('Reminder')}</strong>
					<span>
						{text}
						{next.clinicData?.clinicName && role !== MemberType.CLINIC && <em> · {next.clinicData.clinicName}</em>}
					</span>
				</span>
				<Link href={`/appointment?id=${next._id}`} className="pb-btn pb-btn--primary pb-btn--sm">
					{t('View')}
				</Link>
				<button type="button" className="pb-reminder__close" aria-label={t('Close')} onClick={dismiss}>
					<Icon name="close" size={16} />
				</button>
			</div>
		</div>
	);
};

export default AppointmentReminder;
