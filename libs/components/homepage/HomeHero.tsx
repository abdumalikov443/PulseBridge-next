import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_CLINICS, GET_DOCTORS, GET_MY_APPOINTMENTS } from '../../../apollo/user/query';
import { MemberType } from '../../enums/member.enum';
import { AppointmentStatus } from '../../enums/appointment.enum';
import { Doctor } from '../../types/doctor/doctor';
import { Appointment } from '../../types/appointment/appointment';
import { T } from '../../types/common';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';

export const HERO_IMAGE = '/img/home/hero.jpg';

const HomeHero = () => {
	const user = useReactiveVar(userVar);
	const [photoOk, setPhotoOk] = useState(true);
	const photoRef = useRef<HTMLImageElement>(null);
	const [counts, setCounts] = useState({ clinics: 0, doctors: 0 });
	const [topDoctor, setTopDoctor] = useState<Doctor | null>(null);
	const [nextVisit, setNextVisit] = useState<Appointment | null>(null);

	// the image can fail before hydration, when onError is not attached yet
	useEffect(() => {
		const img = photoRef.current;
		if (img && img.complete && img.naturalWidth === 0) setPhotoOk(false);
	}, []);

	/** APOLLO REQUESTS **/
	useQuery(GET_CLINICS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, search: {} } },
		onCompleted: (data: T) => setCounts((prev) => ({ ...prev, clinics: data?.getClinics?.metaCounter?.[0]?.total ?? 0 })),
	});

	useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-and-network',
		variables: { input: { page: 1, limit: 1, sort: 'doctorRank', direction: 'DESC', search: {} } },
		onCompleted: (data: T) => {
			setCounts((prev) => ({ ...prev, doctors: data?.getDoctors?.metaCounter?.[0]?.total ?? 0 }));
			setTopDoctor(data?.getDoctors?.list?.[0] ?? null);
		},
	});

	// a patient sees the next confirmed visit in the floating card
	useQuery(GET_MY_APPOINTMENTS, {
		fetchPolicy: 'network-only',
		skip: user?.memberType !== MemberType.PATIENT,
		variables: {
			input: { page: 1, limit: 1, sort: 'appointmentDate', direction: 'ASC', search: { appointmentStatus: AppointmentStatus.CONFIRMED } },
		},
		onCompleted: (data: T) => setNextVisit(data?.getMyAppointments?.list?.[0] ?? null),
	});

	return (
		<section className="pb-container pb-hero">
			<div className="pb-hero__copy">
				<span className="pb-badge pb-in" style={{ alignSelf: 'flex-start', padding: '8px 14px', fontSize: 13, color: 'var(--pb-deep)' }}>
					<span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--pb-accent)' }} />
					{counts.clinics} clinics · {counts.doctors} doctors
				</span>
				<h1 className="pb-hero__title pb-in" style={{ animationDelay: '.05s' }}>
					Feeling off?
					<br />
					Let&apos;s find
					<br />
					<em>your doctor.</em>
				</h1>
				<p className="pb-hero__lead pb-in" style={{ animationDelay: '.15s' }}>
					Pick a specialty, meet the doctor, choose a time. No phone calls, no waiting rooms full of questions.
				</p>
				<div className="pb-in" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animationDelay: '.25s' }}>
					<Link href="/doctor" className="pb-btn pb-btn--primary pb-btn--lg">
						Book a visit
						<Icon name="arrow" className="pb-arrow" />
					</Link>
					<Link href="/clinic" className="pb-btn pb-btn--light pb-btn--lg">
						Browse clinics
					</Link>
				</div>
			</div>

			<div className="pb-hero__visual">
				<div className="pb-hero__blob pb-hero__blob--a" aria-hidden="true" />
				<div className="pb-hero__blob pb-hero__blob--b" aria-hidden="true" />
				<figure className="pb-hero__photo">
					{photoOk ? (
						<img ref={photoRef} src={HERO_IMAGE} alt="A doctor talking with a patient in a clinic" onError={() => setPhotoOk(false)} />
					) : (
						<span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
							<Icon name="image" size={52} strokeWidth={1.5} />
						</span>
					)}
					<figcaption>Care that fits your day</figcaption>
				</figure>

				{topDoctor && (
					<Link href={`/doctor/detail?id=${topDoctor._id}`} className="pb-hero__float pb-hero__float--doctor">
						<span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
							<Avatar name={getMemberName(topDoctor.memberData)} image={topDoctor.memberData?.memberImage} size={44} radius={14} />
							<span>
								<strong style={{ display: 'block', fontSize: 15 }}>{getMemberName(topDoctor.memberData)}</strong>
								<span style={{ fontSize: 13, color: 'var(--pb-muted)' }}>
									{formatEnum(topDoctor.specialty)} · {topDoctor.experience} yrs
								</span>
							</span>
						</span>
						<span className="pb-hero__wave" aria-hidden="true">
							<i />
							<i />
							<i />
							<i />
							<span style={{ marginLeft: 8, fontSize: 13, fontWeight: 700, color: 'var(--pb-deep)' }}>Top doctor this week</span>
						</span>
					</Link>
				)}

				<div className="pb-hero__float pb-hero__float--visit">
					<span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', opacity: 0.85 }}>
						{nextVisit ? 'YOUR NEXT VISIT' : 'BOOK IN 3 STEPS'}
					</span>
					<div style={{ fontFamily: 'var(--pb-font-display)', fontSize: 24, fontWeight: 800, marginTop: 4 }}>
						{nextVisit ? `${moment.utc(nextVisit.appointmentDate).format('ddd')} ${nextVisit.appointmentTime}` : 'Doctor · Time · Done'}
					</div>
					<span style={{ fontSize: 13, opacity: 0.85 }}>
						{nextVisit ? nextVisit.clinicData?.clinicName : 'Confirmed right away'}
					</span>
				</div>
			</div>
		</section>
	);
};

export default HomeHero;
