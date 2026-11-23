import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_DOCTORS } from '../../../apollo/user/query';
import { Clinic } from '../../types/clinic/clinic';
import { Doctor } from '../../types/doctor/doctor';
import { ClinicType } from '../../enums/clinic.enum';
import { T } from '../../types/common';
import { REACT_APP_API_URL } from '../../config';
import { formatEnum } from '../../utils';
import { formatCount } from '../ui/ActionChips';
import LikeButton, { STAT_ICON } from '../ui/LikeButton';
import { kakaoMapUrl } from '../../maps';
import { useDoctorIndex } from '../../hooks/useDoctorIndex';
import Icon from '../ui/Icon';
import { openStatus, WEEK_DAY_LABEL } from '../../schedule';

// light covers for clinics without a photo: soft palette tones, the icon in the matching deep color
const covers = [
	{ bg: 'linear-gradient(135deg, #e3f1f9, #cde4f1)', fg: '#1f6f99' },
	{ bg: 'linear-gradient(135deg, #e4f4ec, #cde9dc)', fg: '#0b6b61' },
	{ bg: 'linear-gradient(135deg, #ece9f8, #dad5f0)', fg: '#5d5b8c' },
	{ bg: 'linear-gradient(135deg, #fdeedf, #f8dcc2)', fg: '#a2581c' },
];

interface ClinicCardProps {
	clinic: Clinic;
	liked: boolean;
	likes: number;
	onLike: () => void;
	index?: number;
	style?: React.CSSProperties;
}

// list card: cover with type and views, name with like, address, specialties of its doctors, doctors, directions
const ClinicCard = ({ clinic, liked, likes, onLike, index = 0, style }: ClinicCardProps) => {
	const { t } = useTranslation('common');
	const detail = `/clinic/detail?id=${clinic._id}`;
	const cover = covers[index % covers.length];
	// only lists that ask for the working hours show the status (undefined = not in the query)
	const status = clinic.clinicOpenTime !== undefined ? openStatus(clinic) : null;
	const statusText = !status
		? ''
		: status.state === 'open'
		? t('Open now · until {{time}}', { time: status.time })
		: status.state === 'break'
		? t('On a break · back at {{time}}', { time: status.time })
		: status.day === 'today'
		? t('Closed · opens at {{time}}', { time: status.time })
		: status.day === 'tomorrow'
		? t('Closed · opens tomorrow at {{time}}', { time: status.time })
		: status.day
		? t('Closed · opens {{day}} at {{time}}', { day: t(WEEK_DAY_LABEL[status.day]), time: status.time })
		: t('Closed');
	const [ownTags, setOwnTags] = useState<string[]>([]);

	/** APOLLO REQUESTS **/
	// tags = unique specialties of the doctors who work in this clinic; all cards share one doctor index,
	// a card asks on its own only when there are more doctors than the index holds
	const doctorIndex = useDoctorIndex(!clinic.clinicDoctors);
	useQuery(GET_DOCTORS, {
		fetchPolicy: 'network-only',
		skip: !clinic.clinicDoctors || !doctorIndex || doctorIndex.complete,
		variables: { input: { page: 1, limit: 30, search: { clinicId: clinic._id } } },
		onCompleted: (data: T) => {
			const list: Doctor[] = data?.getDoctors?.list ?? [];
			setOwnTags(Array.from(new Set(list.map((doctor) => doctor.specialty))).slice(0, 3));
		},
	});
	const tags: string[] = doctorIndex?.complete ? (doctorIndex.byClinic.get(clinic._id) ?? []).slice(0, 3) : ownTags;

	return (
		<article className="pb-card pb-card--hover pb-clinic-card" style={style}>
			<Link
				href={detail}
				className={`pb-clinic-card__cover ${clinic.clinicImage ? 'has-image' : ''}`}
				style={{ background: cover.bg }}
			>
				{clinic.clinicImage ? (
					<img src={`${REACT_APP_API_URL}/${clinic.clinicImage}`} alt="" loading="lazy" decoding="async" />
				) : (
					<span className="pb-clinic-card__placeholder" aria-hidden="true" style={{ color: cover.fg }}>
						<Icon name="clinic" size={52} strokeWidth={1.3} />
					</span>
				)}
				<span className={`pb-clinic-card__type ${clinic.clinicType === ClinicType.PUBLIC ? 'is-public' : ''}`}>
					<i aria-hidden="true" />
					{formatEnum(clinic.clinicType)}
				</span>
				<span className="pb-clinic-card__views" aria-label={t('{{count}} views', { count: clinic.clinicViews })}>
					<Icon name="eye" size={STAT_ICON} />
					{formatCount(clinic.clinicViews)}
				</span>
			</Link>
			<div className="pb-clinic-card__body">
				<div className="pb-clinic-card__title">
					<Link href={detail} className="pb-clinic-card__name">
						{clinic.clinicName}
					</Link>
					<LikeButton likes={likes} liked={liked} onLike={onLike} />
				</div>
				<span className="pb-doc-card__meta">
					<Icon name="pin" size={15} />
					{clinic.clinicAddress}
				</span>
				{status && (
					<span className={`pb-open pb-open--${status.state}`}>
						<i aria-hidden="true" />
						{statusText}
					</span>
				)}
			</div>
			{tags.length > 0 && (
				<div className="pb-tags">
					{tags.map((tag) => (
						<span key={tag}>{formatEnum(tag)}</span>
					))}
				</div>
			)}
			<div className="pb-clinic-card__foot">
				<span className="pb-meta-stat">
					<Icon name="users" size={STAT_ICON} />
					{clinic.clinicDoctors ?? 0} {clinic.clinicDoctors === 1 ? t('doctor') : t('doctors')}
				</span>
				<a
					href={kakaoMapUrl(clinic.clinicAddress)}
					target="_blank"
					rel="noreferrer"
					className="pb-btn pb-btn--outline pb-btn--sm"
				>
					<Icon name="navigate" size={14} />
					{t('Directions')}
				</a>
			</div>
		</article>
	);
};

export default ClinicCard;
