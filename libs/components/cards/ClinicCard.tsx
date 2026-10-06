import React from 'react';
import Link from 'next/link';
import { Clinic } from '../../types/clinic/clinic';
import { REACT_APP_API_URL } from '../../config';
import { formatEnum } from '../../utils';
import ActionChips from '../ui/ActionChips';
import Icon from '../ui/Icon';

const covers = ['#B6D6E8', '#EBC9AE', '#C3CBEA', '#BFE0CF'];

interface ClinicCardProps {
	clinic: Clinic;
	liked: boolean;
	likes: number;
	onLike: () => void;
	following?: boolean;
	onFollow?: () => void;
	index?: number;
	style?: React.CSSProperties;
}

// list card: like, view and follow (comments are on the clinic page)
const ClinicCard = ({ clinic, liked, likes, onLike, following, onFollow, index = 0, style }: ClinicCardProps) => {
	const detail = `/clinic/detail?id=${clinic._id}`;

	return (
		<article className="pb-card pb-card--hover" style={{ padding: 14, ...style }}>
			<Link href={detail} className="pb-media" style={{ height: 170, background: covers[index % covers.length] }}>
				{clinic.clinicImage ? (
					<img src={`${REACT_APP_API_URL}/${clinic.clinicImage}`} alt="" />
				) : (
					<span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(22,56,76,.4)' }}>
						<Icon name="clinic" size={44} strokeWidth={1.5} />
					</span>
				)}
				<span className="pb-badge">{formatEnum(clinic.clinicType)}</span>
			</Link>
			<div style={{ padding: '0 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
				<Link href={detail} style={{ fontFamily: 'var(--pb-font-display)', fontSize: 20, fontWeight: 800 }}>
					{clinic.clinicName}
				</Link>
				<span style={{ fontSize: 14, color: 'var(--pb-muted)' }}>
					{clinic.clinicAddress} · {clinic.clinicDoctors} doctors
				</span>
			</div>
			<div style={{ padding: '0 4px 4px' }}>
				<ActionChips
					likes={likes}
					views={clinic.clinicViews}
					liked={liked}
					onLike={onLike}
					following={following}
					onFollow={onFollow}
				/>
			</div>
		</article>
	);
};

export default ClinicCard;
