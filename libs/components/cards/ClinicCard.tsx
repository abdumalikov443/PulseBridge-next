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
import ActionChips from '../ui/ActionChips';
import { kakaoMapUrl } from '../../maps';
import { useDoctorIndex } from '../../hooks/useDoctorIndex';
import Icon from '../ui/Icon';

const covers = [
	'linear-gradient(135deg, #1f4f6b, #10283a)',
	'linear-gradient(135deg, #a07a5c, #6f5039)',
	'linear-gradient(135deg, #8a88b8, #5d5b8c)',
	'linear-gradient(135deg, #3f8f7d, #24594d)',
];

interface ClinicCardProps {
	clinic: Clinic;
	liked: boolean;
	likes: number;
	onLike: () => void;
	index?: number;
	style?: React.CSSProperties;
}

// list card: cover, address, specialties of its doctors, like and view, directions
const ClinicCard = ({ clinic, liked, likes, onLike, index = 0, style }: ClinicCardProps) => {
	const { t } = useTranslation('common');
	const detail = `/clinic/detail?id=${clinic._id}`;
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
			<Link href={detail} className="pb-clinic-card__cover" style={{ background: covers[index % covers.length] }}>
				{clinic.clinicImage ? (
					<img src={`${REACT_APP_API_URL}/${clinic.clinicImage}`} alt="" loading="lazy" decoding="async" />
				) : (
					<span className="pb-clinic-card__placeholder" aria-hidden="true">
						<Icon name="clinic" size={44} strokeWidth={1.4} />
					</span>
				)}
				<span className={`pb-clinic-card__type ${clinic.clinicType === ClinicType.PUBLIC ? 'is-public' : ''}`}>
					<i aria-hidden="true" />
					{formatEnum(clinic.clinicType)}
				</span>
				<span className="pb-clinic-card__count">
					<Icon name="users" size={15} />
					{clinic.clinicDoctors} {clinic.clinicDoctors === 1 ? t('doctor') : t('doctors')}
				</span>
			</Link>
			<div className="pb-clinic-card__body">
				<Link href={detail} className="pb-clinic-card__name">
					{clinic.clinicName}
				</Link>
				<span className="pb-doc-card__meta">
					<Icon name="pin" size={15} />
					{clinic.clinicAddress}
				</span>
			</div>
			{tags.length > 0 && (
				<div className="pb-tags">
					{tags.map((tag) => (
						<span key={tag}>{formatEnum(tag)}</span>
					))}
				</div>
			)}
			<div className="pb-clinic-card__foot">
				<ActionChips likes={likes} views={clinic.clinicViews} liked={liked} onLike={onLike} />
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
