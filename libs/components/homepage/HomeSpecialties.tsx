import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_DOCTORS } from '../../../apollo/user/query';
import { DoctorSpecialty } from '../../enums/doctor.enum';
import { formatEnum } from '../../utils';
import Icon, { IconName } from '../ui/Icon';
import { SPECIALTY_INFO } from '../../specialty';
import { specialtyHref } from './HomeHero';

const tiles = Object.values(DoctorSpecialty).map((specialty) => ({ specialty, ...SPECIALTY_INFO[specialty] }));

// one tile per specialty; the count is metaCounter.total for that specialty
const SpecialtyTile = ({ specialty, icon, tone, desc }: { specialty: DoctorSpecialty; icon: IconName; tone: string; desc: string }) => {
	const { t } = useTranslation('common');
	// read from data: onCompleted does not always fire for cached results
	const { data, error } = useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-first',
		variables: { input: { page: 1, limit: 1, search: { specialtyList: [specialty] } } },
	});
	const count: number | null = error ? 0 : data ? data.getDoctors?.metaCounter?.[0]?.total ?? 0 : null;

	return (
		<Link href={specialtyHref(specialty)} className={`pb-spec pb-spec--${tone} pb-tip`} data-tip={t(desc)} aria-label={`${formatEnum(specialty)}: ${t(desc)}`}>
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
