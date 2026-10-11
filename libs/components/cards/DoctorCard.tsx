import React, { useState } from 'react';
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
import ActionChips from '../ui/ActionChips';
import Icon from '../ui/Icon';

// first free 30-minute slot from the doctor's availability (next 5 days from tomorrow)
const useNextSlot = (doctorId: string) => {
	const [next, setNext] = useState<{ date: string; time: string } | null | undefined>(undefined);
	useQuery(GET_DOCTOR_AVAILABILITY, {
		fetchPolicy: 'network-only',
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

// list card: photo with name, clinic, next slot, like and view, book (follow and reviews live on the detail page)
const DoctorCard = ({ doctor, liked, likes, onLike, style }: DoctorCardProps) => {
	const { t } = useTranslation('common');
	const name = getMemberName(doctor.memberData);
	const detail = `/doctor/detail?id=${doctor._id}`;
	const next = useNextSlot(doctor._id);

	return (
		<article className="pb-card pb-card--hover pb-doc-card" style={style}>
			<Link href={detail} className="pb-doc-card__top">
				<Avatar name={name} image={doctor.memberData?.memberImage} size={56} radius={18} />
				<span style={{ minWidth: 0 }}>
					<strong className="pb-doc-card__name">{name}</strong>
					<span className="pb-doc-card__spec">{formatEnum(doctor.specialty)}</span>
				</span>
			</Link>
			<span className="pb-doc-card__meta pb-doc-card__meta--one" title={doctor.clinicData?.clinicName}>
				<Icon name="clinic" size={15} />
				<span>
					{doctor.clinicData ? shortName(doctor.clinicData.clinicName) : t('No clinic yet')} · {doctor.experience}{' '}
					{t('yrs of exp')}
				</span>
			</span>
			<div className="pb-doc-card__next">
				<span>{t('Next available')}</span>
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
			<ActionChips likes={likes} views={doctor.doctorViews} liked={liked} onLike={onLike} />
			<Link href={`/booking?doctorId=${doctor._id}`} className="pb-btn pb-btn--primary pb-btn--block">
				<Icon name="calendar" size={16} />
				{t('Book')}
			</Link>
		</article>
	);
};

export default DoctorCard;
