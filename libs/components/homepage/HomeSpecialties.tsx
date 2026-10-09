import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_DOCTORS } from '../../../apollo/user/query';
import { DoctorSpecialty } from '../../enums/doctor.enum';
import { T } from '../../types/common';
import { formatEnum } from '../../utils';
import Icon, { IconName } from '../ui/Icon';
import { specialtyHref } from './HomeHero';

const tiles: { specialty: DoctorSpecialty; icon: IconName; tone: string }[] = [
	{ specialty: DoctorSpecialty.CARDIOLOGY, icon: 'heart', tone: 'pink' },
	{ specialty: DoctorSpecialty.DERMATOLOGY, icon: 'shield', tone: 'blue' },
	{ specialty: DoctorSpecialty.PEDIATRICS, icon: 'smile', tone: 'orange' },
	{ specialty: DoctorSpecialty.NEUROLOGY, icon: 'brain', tone: 'violet' },
	{ specialty: DoctorSpecialty.DENTISTRY, icon: 'tooth', tone: 'sand' },
	{ specialty: DoctorSpecialty.GENERAL, icon: 'stethoscope', tone: 'green' },
];

// one tile per specialty; the count is metaCounter.total for that specialty
const SpecialtyTile = ({ specialty, icon, tone }: { specialty: DoctorSpecialty; icon: IconName; tone: string }) => {
	const { t } = useTranslation('common');
	const [count, setCount] = useState<number | null>(null);

	useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-first',
		variables: { input: { page: 1, limit: 1, search: { specialtyList: [specialty] } } },
		onCompleted: (data: T) => setCount(data?.getDoctors?.metaCounter?.[0]?.total ?? 0),
		onError: () => setCount(0),
	});

	return (
		<Link href={specialtyHref(specialty)} className={`pb-spec pb-spec--${tone}`}>
			<span className={`pb-spec__icon pb-tone--${tone}`}>
				<Icon name={icon} />
			</span>
			<span>
				<strong>{formatEnum(specialty)}</strong>
				<small>{count === null ? '…' : `${count} ${count === 1 ? t('doctor') : t('doctors')}`}</small>
			</span>
		</Link>
	);
};

const HomeSpecialties = () => {
	const { t } = useTranslation('common');

	return (
		<section className="pb-container pb-section" aria-labelledby="home-specialties">
			<div className="pb-section-head">
				<div>
					<h2 className="pb-title" id="home-specialties">
						{t('Explore by specialty')}
					</h2>
					<p className="pb-section-sub">{t('Doctors grouped by their medical field')}</p>
				</div>
				<Link href="/doctor" className="pb-more">
					{t('All doctors')} <Icon name="arrow" size={16} className="pb-arrow" />
				</Link>
			</div>
			<div className="pb-spec-grid">
				{tiles.map((tile) => (
					<SpecialtyTile key={tile.specialty} {...tile} />
				))}
			</div>
		</section>
	);
};

export default HomeSpecialties;
