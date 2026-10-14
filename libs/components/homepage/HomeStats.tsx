import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { GET_ARTICLES, GET_CLINICS } from '../../../apollo/user/query';
import { useDoctorIndex } from '../../hooks/useDoctorIndex';
import { T } from '../../types/common';
import Icon, { IconName } from '../ui/Icon';

const first = { page: 1, limit: 1, search: {} };

// real totals from the list queries (metaCounter), no invented numbers
const HomeStats = () => {
	const { t } = useTranslation('common');
	const [counts, setCounts] = useState<{ clinics?: number; articles?: number }>({});
	// the doctor total is shared with the specialty tiles (one request)
	const doctorIndex = useDoctorIndex();

	/** APOLLO REQUESTS **/
	useQuery(GET_CLINICS, {
		fetchPolicy: 'network-only',
		variables: { input: first },
		onCompleted: (data: T) =>
			setCounts((prev) => ({ ...prev, clinics: data?.getClinics?.metaCounter?.[0]?.total ?? 0 })),
	});
	useQuery(GET_ARTICLES, {
		fetchPolicy: 'network-only',
		variables: { input: first },
		onCompleted: (data: T) =>
			setCounts((prev) => ({ ...prev, articles: data?.getArticles?.metaCounter?.[0]?.total ?? 0 })),
	});

	const items: { icon: IconName; tone: string; value?: number; label: string }[] = [
		{ icon: 'stethoscope', tone: 'blue', value: doctorIndex?.total, label: t('Doctors on PulseBridge') },
		{ icon: 'clinic', tone: 'green', value: counts.clinics, label: t('Clinics and hospitals') },
		{ icon: 'book', tone: 'orange', value: counts.articles, label: t('Health articles') },
	];

	return (
		<div className="pb-container pb-home-stats">
			{items.map((item) => (
				<div key={item.icon} className="pb-home-stat">
					<span className={`pb-home-stat__icon pb-tone--${item.tone}`}>
						<Icon name={item.icon} />
					</span>
					<span>
						<strong>{item.value ?? '–'}</strong>
						<small>{item.label}</small>
					</span>
				</div>
			))}
		</div>
	);
};

export default HomeStats;
