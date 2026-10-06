import React from 'react';
import Link from 'next/link';
import { Doctor } from '../../types/doctor/doctor';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import Avatar from '../ui/Avatar';
import ActionChips from '../ui/ActionChips';

interface DoctorCardProps {
	doctor: Doctor;
	liked: boolean;
	likes: number;
	onLike: () => void;
	following?: boolean;
	onFollow?: () => void;
	style?: React.CSSProperties;
}

// list card: like, view and follow only (followers and reviews live on the detail page)
const DoctorCard = ({ doctor, liked, likes, onLike, following, onFollow, style }: DoctorCardProps) => {
	const name = getMemberName(doctor.memberData);
	const detail = `/doctor/detail?id=${doctor._id}`;

	return (
		<article className="pb-card pb-card--hover" style={style}>
			<Link href={detail} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
				<Avatar name={name} image={doctor.memberData?.memberImage} size={52} />
				<span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
					<strong style={{ fontSize: 16 }}>{name}</strong>
					<span style={{ fontSize: 13, color: 'var(--pb-muted)' }}>
						{formatEnum(doctor.specialty)}
						{doctor.clinicData?.clinicName ? ` · ${doctor.clinicData.clinicName}` : ''}
					</span>
				</span>
			</Link>
			<span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pb-deep)' }}>{doctor.experience} years experience</span>
			<ActionChips likes={likes} views={doctor.doctorViews} liked={liked} onLike={onLike} />
			<div style={{ display: 'flex', gap: 8 }}>
				{onFollow && (
					<button
						type="button"
						className={`pb-chip ${following ? 'pb-chip--following' : 'pb-chip--follow'}`}
						aria-pressed={!!following}
						onClick={onFollow}
					>
						{following ? 'Following' : 'Follow'}
					</button>
				)}
				<Link href={`/booking?doctorId=${doctor._id}`} className="pb-btn pb-btn--primary pb-btn--sm" style={{ flex: 1 }}>
					Book
				</Link>
			</div>
		</article>
	);
};

export default DoctorCard;
