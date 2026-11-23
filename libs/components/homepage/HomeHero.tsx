import React, { useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import {
	GET_CLINIC_APPOINTMENTS,
	GET_DOCTOR_APPOINTMENTS,
	GET_DOCTORS,
	GET_MY_APPOINTMENTS,
} from '../../../apollo/user/query';
import { MemberType } from '../../enums/member.enum';
import { AppointmentStatus } from '../../enums/appointment.enum';
import { DoctorSpecialty } from '../../enums/doctor.enum';
import { Doctor } from '../../types/doctor/doctor';
import { Appointment } from '../../types/appointment/appointment';
import { T } from '../../types/common';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';

export const specialtyHref = (specialty: DoctorSpecialty) =>
	`/doctor?input=${JSON.stringify({
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: { specialtyList: [specialty] },
	})}`;

const HomeHero = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const isPatient = user?.memberType === MemberType.PATIENT;
	const isDoctor = user?.memberType === MemberType.DOCTOR;
	const isClinic = user?.memberType === MemberType.CLINIC;
	const isAdmin = user?.memberType === MemberType.ADMIN;
	// only patients (and guests, after login) book; doctors and clinics see their own schedule here
	const canBook = !user?._id || isPatient;

	/** APOLLO REQUESTS **/
	// read from data: onCompleted does not always fire for cached results
	const { data: topData } = useQuery(GET_DOCTORS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 1, sort: 'doctorRank', direction: 'DESC', search: {} } },
	});
	const topDoctor: Doctor | null = topData?.getDoctors?.list?.[0] ?? null;

	// the next confirmed visit: my booking (patient), my next patient (doctor) or the clinic's next visit
	const visitQuery = isDoctor
		? { query: GET_DOCTOR_APPOINTMENTS, key: 'getDoctorAppointments' }
		: isClinic
		? { query: GET_CLINIC_APPOINTMENTS, key: 'getClinicAppointments' }
		: { query: GET_MY_APPOINTMENTS, key: 'getMyAppointments' };
	const { data: visitData } = useQuery(visitQuery.query, {
		fetchPolicy: 'network-only',
		skip: !(isPatient || isDoctor || isClinic),
		variables: {
			input: {
				page: 1,
				limit: 1,
				sort: 'appointmentDate',
				direction: 'ASC',
				search: { appointmentStatus: AppointmentStatus.CONFIRMED },
			},
		},
	});
	const nextVisit: Appointment | null = visitData?.[visitQuery.key]?.list?.[0] ?? null;
	const staff = isDoctor || isClinic;

	return (
		<section className="pb-home-hero">
			<div className="pb-container pb-home-hero__grid">
				<div className="pb-home-hero__copy">
					<span className="pb-note pb-in">
						<i aria-hidden="true" />
						{t('Patient-first clinical network in Seoul')}
					</span>
					<h1 className="pb-home-hero__title pb-in" style={{ animationDelay: '.05s' }}>
						{t('Healthcare that listens.')} <em>{t('Care you can count on.')}</em>
					</h1>
					<p className="pb-home-hero__lead pb-in" style={{ animationDelay: '.15s' }}>
						{t('Pick a specialty, compare doctors and clinics, and book a visit at a time that suits you.')}
					</p>
					<div className="pb-home-hero__ctas pb-in" style={{ animationDelay: '.25s' }}>
						<Link href="/doctor" className="pb-btn pb-btn--primary pb-btn--lg">
							<Icon name="stethoscope" />
							{t('Find a Doctor')}
						</Link>
						<Link href="/clinic" className="pb-btn pb-btn--outline pb-btn--lg">
							<Icon name="pin" />
							{t('Explore Clinics')}
						</Link>
					</div>
				</div>

				<aside className="pb-care" aria-label={t('Your care')}>
					<div className="pb-care__top">
						<span className="pb-care__icon">
							<Icon name="calendar" />
						</span>
						<div style={{ flex: 1, minWidth: 0 }}>
							<strong>{t('Your care')}</strong>
							<small>{staff ? t('Your schedule and top doctors') : t('Visits and top doctors')}</small>
						</div>
						<span className={`pb-badge ${user?._id ? 'pb-badge--success' : 'pb-badge--soft'}`}>
							{user?._id ? t('Signed in') : t('Guest')}
						</span>
					</div>

					{topDoctor && (
						<div className="pb-care__doctor">
							<Link
								href={`/doctor/detail?id=${topDoctor._id}`}
								style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}
							>
								<Avatar
									name={getMemberName(topDoctor.memberData)}
									image={topDoctor.memberData?.memberImage}
									size={48}
									radius={16}
								/>
								<span style={{ minWidth: 0 }}>
									<strong style={{ display: 'block' }}>{getMemberName(topDoctor.memberData)}</strong>
									<small>
										{formatEnum(topDoctor.specialty)}
										{topDoctor.clinicData?.clinicName ? ` · ${topDoctor.clinicData.clinicName}` : ''}
									</small>
								</span>
							</Link>
							{canBook ? (
								<Link href={`/booking?doctorId=${topDoctor._id}`} className="pb-btn pb-btn--primary pb-btn--sm">
									{t('Book')}
								</Link>
							) : (
								<Link href={`/doctor/detail?id=${topDoctor._id}`} className="pb-btn pb-btn--light pb-btn--sm">
									{t('View')}
								</Link>
							)}
						</div>
					)}

					{nextVisit ? (
						<Link href={`/appointment?id=${nextVisit._id}`} className="pb-care__visit">
							<span className="pb-care__visit-icon">
								<Icon name="calendar" />
							</span>
							<span style={{ minWidth: 0 }}>
								<small>{staff ? t('Next patient') : t('Upcoming visit')}</small>
								<strong>
									{moment.utc(nextVisit.appointmentDate).format('ddd, MMM D')} · {nextVisit.appointmentTime}
								</strong>
								<span>
									{staff
										? `${getMemberName(nextVisit.memberData)}${
												isClinic && nextVisit.doctorData
													? ` · ${t('Dr.')} ${getMemberName(nextVisit.doctorData.memberData)}`
													: ''
										  }`
										: nextVisit.clinicData?.clinicName}
								</span>
							</span>
							<span className="pb-care__tag">{formatEnum(nextVisit.appointmentStatus)}</span>
						</Link>
					) : staff ? (
						<Link href="/mypage?category=myAppointments" className="pb-care__visit">
							<span className="pb-care__visit-icon">
								<Icon name="calendar" />
							</span>
							<span style={{ minWidth: 0 }}>
								<small>{t('Your schedule')}</small>
								<strong>{t('No booked visits yet')}</strong>
								<span>
									{isClinic ? t('Patients book your doctors here') : t('Patients book you from your profile')}
								</span>
							</span>
							<Icon name="arrow" className="pb-arrow" />
						</Link>
					) : isAdmin ? (
						<Link href="/_admin" className="pb-care__visit">
							<span className="pb-care__visit-icon">
								<Icon name="users" />
							</span>
							<span style={{ minWidth: 0 }}>
								<small>{t('Admin')}</small>
								<strong>{t('Admin panel')}</strong>
								<span>{t('Members, clinics, articles and appointments')}</span>
							</span>
							<Icon name="arrow" className="pb-arrow" />
						</Link>
					) : (
						<Link href={user?._id ? '/doctor' : '/account/join'} className="pb-care__visit">
							<span className="pb-care__visit-icon">
								<Icon name="clock" />
							</span>
							<span style={{ minWidth: 0 }}>
								<small>{t('Book in 3 steps')}</small>
								<strong>{t('Doctor · Time · Done')}</strong>
								<span>{user?._id ? t('No upcoming visits yet') : t('Sign in to see your visits')}</span>
							</span>
							<Icon name="arrow" className="pb-arrow" />
						</Link>
					)}

					<svg className="pb-care__ecg" viewBox="0 0 300 34" preserveAspectRatio="none" aria-hidden="true">
						<path d="M0 17h90l10-12 12 24 10-20 8 8h170" />
					</svg>
				</aside>
			</div>
		</section>
	);
};

export default HomeHero;
