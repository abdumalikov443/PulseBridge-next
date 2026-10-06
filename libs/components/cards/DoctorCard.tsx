import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Doctor } from '../../types/doctor/doctor';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import Avatar from '../ui/Avatar';
import ActionChips from '../ui/ActionChips';
import Icon from '../ui/Icon';

// TODO: the backend has no schedule API yet, so "Next available" is static for now
const nextSlots = [
	{ label: 'Today, 14:30', soon: true },
	{ label: 'Tomorrow, 10:00', soon: true },
	{ label: 'Today, 17:00', soon: true },
	{ label: 'Wed, 09:00', soon: false },
];
const slotFor = (id: string) => nextSlots[id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % nextSlots.length];

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
	const slot = slotFor(doctor._id);

	return (
		<article className="pb-card pb-card--hover pb-doc-card" style={style}>
			<Link href={detail} className="pb-doc-card__top">
				<Avatar name={name} image={doctor.memberData?.memberImage} size={56} radius={18} />
				<span style={{ minWidth: 0 }}>
					<strong className="pb-doc-card__name">{name}</strong>
					<span className="pb-doc-card__spec">{formatEnum(doctor.specialty)}</span>
				</span>
			</Link>
			<span className="pb-doc-card__meta">
				<Icon name="clinic" size={15} />
				{doctor.clinicData?.clinicName ?? t('No clinic yet')} · {doctor.experience} {t('yrs of exp')}
			</span>
			<div className="pb-doc-card__next">
				<span>{t('Next available')}</span>
				<b className={slot.soon ? '' : 'is-later'}>{slot.label}</b>
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
