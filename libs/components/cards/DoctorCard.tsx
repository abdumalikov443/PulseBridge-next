import React, { useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_DOCTOR_AVAILABILITY } from '../../../apollo/user/query';
import { DayAvailability } from '../../types/appointment/availability';
import { T } from '../../types/common';
import { dayLabel, isTomorrow } from '../../schedule';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Doctor } from '../../types/doctor/doctor';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import Avatar from '../ui/Avatar';
import { formatCount } from '../ui/ActionChips';
import LikeButton, { STAT_ICON } from '../ui/LikeButton';
import Icon from '../ui/Icon';
import { useInView } from '../../hooks/useInView';

// first free 30-minute slot from the doctor's availability (next 5 days from tomorrow);
// asked only once the card comes near the screen, so a long list does not send one request per card at once
const useNextSlot = (doctorId: string, visible: boolean) => {
	const [next, setNext] = useState<{ date: string; time: string } | null | undefined>(undefined);
	useQuery(GET_DOCTOR_AVAILABILITY, {
		fetchPolicy: 'network-only',
		skip: !visible,
		variables: { doctorId },
		onCompleted: (data: T) => {
			const days: DayAvailability[] = data?.getDoctorAvailability ?? [];
			const day = days.find((ele) => ele.isOpen && ele.slots.some((slot) => slot.available));
			const slot = day?.slots.find((ele) => ele.available);
			setNext(day && slot ? { date: day.date, time: slot.time } : null);
		},
		onError: () => setNext(null),
	});
	return next;
};

// the card shows the first two words of the clinic name; the doctor page shows it in full
const shortName = (name: string) => {
	const words = name.trim().split(/\s+/);
	return words.length > 2 ? `${words.slice(0, 2).join(' ')}…` : name;
};

interface DoctorCardProps {
	doctor: Doctor;
	liked: boolean;
	likes: number;
	onLike: () => void;
	style?: React.CSSProperties;
}

// list card: photo with name and like, clinic, next slot, patients served and book (follow and reviews live on the detail page)
const DoctorCard = ({ doctor, liked, likes, onLike, style }: DoctorCardProps) => {
	const { t } = useTranslation('common');
	const name = getMemberName(doctor.memberData);
	const detail = `/doctor/detail?id=${doctor._id}`;
	const cardRef = useRef<HTMLElement>(null);
	// card lists get the slot with the doctor (GET_DOCTOR_CARDS); other lists ask for it when the card comes near the screen
	const known = doctor.nextAvailable !== undefined;
	const lazyNext = useNextSlot(doctor._id, useInView(cardRef) && !known);
	const next = known ? doctor.nextAvailable : lazyNext;
	const served = doctor.patientsServed ?? 0;

	return (
		<article ref={cardRef} className="pb-card pb-card--hover pb-doc-card" style={style}>
			<div className="pb-doc-card__head">
				<Link href={detail} className="pb-doc-card__top">
					<Avatar name={name} image={doctor.memberData?.memberImage} size={52} radius={16} />
					<span style={{ minWidth: 0 }}>
						<strong className="pb-doc-card__name" title={`Dr. ${name}`}>
							Dr. {name}
						</strong>
						<span className="pb-doc-card__spec">{formatEnum(doctor.specialty)}</span>
					</span>
				</Link>
				<LikeButton likes={likes} liked={liked} onLike={onLike} />
			</div>
			<span className="pb-doc-card__meta pb-doc-card__meta--one" title={doctor.clinicData?.clinicName}>
				<Icon name="clinic" size={15} />
				<span>
					{doctor.clinicData ? shortName(doctor.clinicData.clinicName) : t('No clinic yet')} · {doctor.experience}{' '}
					{t('yrs of exp')}
				</span>
			</span>
			<div className="pb-doc-card__next">
				<span>{t('Next available:')}</span>
				{next === undefined ? (
					<b className="is-loading">…</b>
				) : next ? (
					<b className={isTomorrow(next.date) ? '' : 'is-later'}>
						{dayLabel(next.date)}, {next.time}
					</b>
				) : (
					<b className="is-none">{t('No free time')}</b>
				)}
			</div>
			<div className="pb-doc-card__foot">
				<span className="pb-meta-stat">
					<Icon name="users" size={STAT_ICON} />
					{formatCount(served)} {served === 1 ? t('patient served') : t('patients served')}
				</span>
				<Link href={`/booking?doctorId=${doctor._id}`} className="pb-btn pb-btn--primary pb-btn--sm">
					<Icon name="calendar" size={14} />
					{t('Book')}
				</Link>
			</div>
		</article>
	);
};

export default DoctorCard;
