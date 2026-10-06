import React, { useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_DOCTORS, GET_MY_APPOINTMENTS } from '../../../apollo/user/query';
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
	`/doctor?input=${JSON.stringify({ page: 1, limit: 10, sort: 'createdAt', direction: 'DESC', search: { specialtyList: [specialty] } })}`;

const popular = [DoctorSpecialty.CARDIOLOGY, DoctorSpecialty.PEDIATRICS, DoctorSpecialty.DENTISTRY, DoctorSpecialty.GENERAL];

const HomeHero = () => {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const isPatient = user?.memberType === MemberType.PATIENT;
	const [topDoctor, setTopDoctor] = useState<Doctor | null>(null);
	const [nextVisit, setNextVisit] = useState<Appointment | null>(null);

	/** APOLLO REQUESTS **/
	useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, sort: 'doctorRank', direction: 'DESC', search: {} } },
		onCompleted: (data: T) => setTopDoctor(data?.getDoctors?.list?.[0] ?? null),
	});

	// a patient sees the next confirmed visit in the care card
	useQuery(GET_MY_APPOINTMENTS, {
		fetchPolicy: 'network-only',
		skip: !isPatient,
		variables: {
			input: { page: 1, limit: 1, sort: 'appointmentDate', direction: 'ASC', search: { appointmentStatus: AppointmentStatus.CONFIRMED } },
		},
		onCompleted: (data: T) => setNextVisit(data?.getMyAppointments?.list?.[0] ?? null),
	});

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
					<div className="pb-home-hero__popular pb-in" style={{ animationDelay: '.2s' }}>
						<span>
							<Icon name="search" size={14} />
							{t('Popular specialties')}
						</span>
						{popular.map((specialty) => (
							<Link key={specialty} href={specialtyHref(specialty)} className="pb-chip">
								{formatEnum(specialty)}
							</Link>
						))}
					</div>
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
							<small>{t('Visits and top doctors')}</small>
						</div>
						<span className={`pb-badge ${user?._id ? 'pb-badge--success' : 'pb-badge--soft'}`}>
							{user?._id ? t('Signed in') : t('Guest')}
						</span>
					</div>

					{topDoctor && (
						<div className="pb-care__doctor">
							<Link href={`/doctor/detail?id=${topDoctor._id}`} style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
								<Avatar name={getMemberName(topDoctor.memberData)} image={topDoctor.memberData?.memberImage} size={48} radius={16} />
								<span style={{ minWidth: 0 }}>
									<strong style={{ display: 'block' }}>{getMemberName(topDoctor.memberData)}</strong>
									<small>
										{formatEnum(topDoctor.specialty)}
										{topDoctor.clinicData?.clinicName ? ` · ${topDoctor.clinicData.clinicName}` : ''}
									</small>
								</span>
							</Link>
							<Link href={`/booking?doctorId=${topDoctor._id}`} className="pb-btn pb-btn--primary pb-btn--sm">
								{t('Book')}
							</Link>
						</div>
					)}

					{nextVisit ? (
						<Link href="/mypage?category=myAppointments" className="pb-care__visit">
							<span className="pb-care__visit-icon">
								<Icon name="calendar" />
							</span>
							<span style={{ minWidth: 0 }}>
								<small>{t('Upcoming visit')}</small>
								<strong>
									{moment.utc(nextVisit.appointmentDate).format('ddd, MMM D')} · {nextVisit.appointmentTime}
								</strong>
								<span>{nextVisit.clinicData?.clinicName}</span>
							</span>
							<span className="pb-care__tag">{formatEnum(nextVisit.appointmentStatus)}</span>
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
