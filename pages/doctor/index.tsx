import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import DoctorCard from '../../libs/components/cards/DoctorCard';
import { SkeletonCards } from '../../libs/components/ui/Loaders';
import Icon from '../../libs/components/ui/Icon';
import SortSelect from '../../libs/components/ui/SortSelect';
import { SPECIALTY_INFO } from '../../libs/specialty';
import PbPagination from '../../libs/components/ui/PbPagination';
import { useDebouncedValue } from '../../libs/hooks/useDebouncedValue';
import { GET_DOCTOR_CARDS } from '../../apollo/user/query';
import { LIKE_TARGET_DOCTOR } from '../../apollo/user/mutation';
import { useLikeToggle } from '../../libs/hooks/useEngagement';
import { Doctor } from '../../libs/types/doctor/doctor';
import { DoctorsInquiry } from '../../libs/types/doctor/doctor.input';
import { DoctorSpecialty } from '../../libs/enums/doctor.enum';
import { Direction } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { formatEnum } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const initialInput: DoctorsInquiry = { page: 1, limit: 12, sort: 'doctorRank', direction: Direction.DESC, search: {} };

const sortOptions = [
	{ value: 'doctorRank', label: 'Top rated' },
	{ value: 'doctorLikes', label: 'Most liked' },
	{ value: 'doctorFollowers', label: 'Most followed' },
	{ value: 'doctorViews', label: 'Most viewed' },
	{ value: 'experience', label: 'Experience' },
	{ value: 'createdAt', label: 'Newest' },
];

const DoctorList: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [input, setInput] = useState<DoctorsInquiry>(initialInput);
	const [text, setText] = useState('');
	const [doctors, setDoctors] = useState<Doctor[] | null>(null);
	const [total, setTotal] = useState(0);
	const { likeState, toggleLike } = useLikeToggle(LIKE_TARGET_DOCTOR);

	/** APOLLO REQUESTS **/
	const { loading } = useQuery(GET_DOCTOR_CARDS, {
		fetchPolicy: 'network-only',
		variables: { input },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setDoctors(data?.getDoctors?.list ?? []);
			setTotal(data?.getDoctors?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setDoctors([]),
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (!router.isReady) return;
		const raw = router.query.input as string | undefined;
		const parsed: DoctorsInquiry = raw ? { ...initialInput, ...JSON.parse(raw) } : initialInput;
		setInput(parsed);
		setText(parsed.search?.text ?? '');
	}, [router.isReady, router.query.input]);

	/** HANDLERS **/
	const pushInput = (next: DoctorsInquiry) => {
		const url = `/doctor?input=${JSON.stringify(next)}`;
		router.push(url, url, { scroll: false });
	};

	const setSearch = (patch: T) => {
		const search: T = { ...input.search, ...patch };
		Object.keys(search).forEach((key) => (search[key] === undefined || search[key] === '') && delete search[key]);
		pushInput({ ...input, page: 1, search });
	};

	const specialty = input.search?.specialtyList?.[0];
	// five specialties first; "More..." shows the rest (always shown when the chosen one is hidden)
	const specialties = Object.values(DoctorSpecialty);
	const [showAll, setShowAll] = useState(false);
	const shownSpecialties =
		showAll || (specialty && specialties.indexOf(specialty) >= 5) ? specialties : specialties.slice(0, 5);

	// live search: runs after typing stops; an emptied box also resets the sort (page refetches)
	const debouncedText = useDebouncedValue(text, 400);
	useEffect(() => {
		if (!router.isReady) return;
		const typed = debouncedText.trim();
		if (typed === (input.search?.text ?? '')) return;
		if (!typed) {
			const search: T = { ...input.search };
			delete search.text;
			pushInput({ ...input, page: 1, sort: initialInput.sort, direction: initialInput.direction, search });
		} else {
			setSearch({ text: typed });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedText]);

	return (
		<div className="pb-container">
			<header className="pb-page-head">
				<h1 className="pb-title">{t('Find a doctor')}</h1>
				<p>{t('Only doctors working in an active clinic are listed and can be booked.')}</p>
			</header>

			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '16px 0' }}>
				<form className="pb-search" style={{ flex: '1 1 280px' }} onSubmit={(e) => e.preventDefault()}>
					<Icon name="search" />
					<label htmlFor="doctor-search" className="pb-sr">
						{t('Doctor name')}
					</label>
					<input
						id="doctor-search"
						value={text}
						placeholder={t('Doctor name')}
						onChange={(e) => setText(e.target.value)}
					/>
				</form>
				<SortSelect
					value={input.sort ?? initialInput.sort!}
					options={sortOptions}
					onChange={(sort) => pushInput({ ...input, page: 1, sort, direction: Direction.DESC })}
				/>
			</div>

			<div className="pb-pills" role="group" aria-label={t('Specialty')}>
				<button
					type="button"
					className={`pb-pill ${!specialty ? 'pb-pill--active' : ''}`}
					aria-pressed={!specialty}
					onClick={() => setSearch({ specialtyList: undefined })}
				>
					{t('All')}
				</button>
				{shownSpecialties.map((value) => (
					<button
						key={value}
						type="button"
						className={`pb-pill pb-tip ${specialty === value ? 'pb-pill--active' : ''}`}
						data-tip={t(SPECIALTY_INFO[value].desc)}
						aria-pressed={specialty === value}
						aria-description={t(SPECIALTY_INFO[value].desc)}
						onClick={() => setSearch({ specialtyList: [value] })}
					>
						{formatEnum(value)}
					</button>
				))}
				{shownSpecialties.length < specialties.length && (
					<button type="button" className="pb-pill pb-pill--more" onClick={() => setShowAll(true)}>
						{t('More...')}
					</button>
				)}
			</div>

			<p style={{ margin: '20px 0 12px', minHeight: 20, fontSize: 14, fontWeight: 700, color: 'var(--pb-muted)' }}>
				{/* the count waits for the first answer, so "0 found" never flashes while loading */}
				{doctors !== null &&
					!(loading && doctors.length === 0) &&
					(total === 1
						? t('{{count}} doctor found', { count: total })
						: t('{{count}} doctors found', { count: total }))}
			</p>

			<div className="pb-grid">
				{(doctors === null || (loading && doctors.length === 0)) && <SkeletonCards count={8} />}
				{doctors?.map((doctor) => {
					const state = likeState(doctor._id, !!doctor.meLiked?.[0]?.myFavorite, doctor.doctorLikes);
					return (
						<DoctorCard
							key={doctor._id}
							doctor={doctor}
							liked={state.liked}
							likes={state.likes}
							onLike={() => toggleLike(doctor._id, state)}
						/>
					);
				})}
			</div>
			{doctors?.length === 0 && !loading && <p className="pb-empty">{t('No doctors match these filters.')}</p>}

			<PbPagination
				page={input.page}
				total={total}
				limit={input.limit}
				onChange={(page) => pushInput({ ...input, page })}
			/>
		</div>
	);
};

export default withPbLayout(DoctorList);
