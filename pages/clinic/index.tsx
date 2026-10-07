import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { Pagination } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import ClinicCard from '../../libs/components/cards/ClinicCard';
import { SkeletonCards } from '../../libs/components/ui/Loaders';
import Icon from '../../libs/components/ui/Icon';
import { GET_CLINICS } from '../../apollo/user/query';
import { LIKE_TARGET_CLINIC } from '../../apollo/user/mutation';
import { useLikeToggle } from '../../libs/hooks/useEngagement';
import { Clinic } from '../../libs/types/clinic/clinic';
import { ClinicsInquiry } from '../../libs/types/clinic/clinic.input';
import { ClinicType } from '../../libs/enums/clinic.enum';
import { Direction } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';
import { formatEnum } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const initialInput: ClinicsInquiry = { page: 1, limit: 9, sort: 'clinicRank', direction: Direction.DESC, search: {} };

const sortOptions = [
	{ value: 'clinicRank', label: 'Top rated' },
	{ value: 'clinicLikes', label: 'Most liked' },
	{ value: 'clinicFollowers', label: 'Most followed' },
	{ value: 'clinicDoctors', label: 'Most doctors' },
	{ value: 'createdAt', label: 'Newest' },
];

const ClinicList: NextPage = () => {
	const router = useRouter();
	const [input, setInput] = useState<ClinicsInquiry>(initialInput);
	const [text, setText] = useState('');
	const [clinics, setClinics] = useState<Clinic[] | null>(null);
	const [total, setTotal] = useState(0);
	const { likeState, toggleLike } = useLikeToggle(LIKE_TARGET_CLINIC);

	/** APOLLO REQUESTS **/
	const { loading } = useQuery(GET_CLINICS, {
		fetchPolicy: 'cache-and-network',
		variables: { input },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setClinics(data?.getClinics?.list ?? []);
			setTotal(data?.getClinics?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setClinics([]),
	});

	/** LIFECYCLES **/
	useEffect(() => {
		if (!router.isReady) return;
		const raw = router.query.input as string | undefined;
		const parsed: ClinicsInquiry = raw ? { ...initialInput, ...JSON.parse(raw) } : initialInput;
		setInput(parsed);
		setText(parsed.search?.text ?? '');
	}, [router.isReady, router.query.input]);

	/** HANDLERS **/
	const pushInput = (next: ClinicsInquiry) => {
		const url = `/clinic?input=${JSON.stringify(next)}`;
		router.push(url, url, { scroll: false });
	};

	const setSearch = (patch: T) => {
		const search: T = { ...input.search, ...patch };
		Object.keys(search).forEach((key) => (search[key] === undefined || search[key] === '') && delete search[key]);
		pushInput({ ...input, page: 1, search });
	};

	const clinicType = input.search?.clinicType;

	return (
		<div className="pb-container">
			<header className="pb-page-head">
				<h1 className="pb-title">Find a clinic</h1>
				<p>Private and public clinics with their doctors and patient reviews.</p>
			</header>

			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '16px 0' }}>
				<div className="pb-pills" role="group" aria-label="Clinic type" style={{ flex: '1 1 auto' }}>
					<button
						type="button"
						className={`pb-pill ${!clinicType ? 'pb-pill--active' : ''}`}
						aria-pressed={!clinicType}
						onClick={() => setSearch({ clinicType: undefined })}
					>
						All clinics
					</button>
					{Object.values(ClinicType).map((type) => (
						<button
							key={type}
							type="button"
							className={`pb-pill ${clinicType === type ? 'pb-pill--active' : ''}`}
							aria-pressed={clinicType === type}
							onClick={() => setSearch({ clinicType: type })}
						>
							{formatEnum(type)}
						</button>
					))}
				</div>
				<form
					className="pb-search"
					style={{ flex: '1 1 260px', maxWidth: 360 }}
					onSubmit={(e) => {
						e.preventDefault();
						setSearch({ text: text.trim() || undefined });
					}}
				>
					<Icon name="search" />
					<label htmlFor="clinic-search" className="pb-sr">
						Clinic name
					</label>
					<input id="clinic-search" value={text} placeholder="Clinic name" onChange={(e) => setText(e.target.value)} />
				</form>
				<label className="pb-search" style={{ flex: '0 1 200px' }}>
					<span className="pb-sr">Sort by</span>
					<select
						value={input.sort}
						onChange={(e) => pushInput({ ...input, page: 1, sort: e.target.value, direction: Direction.DESC })}
						style={{ border: 0, background: 'transparent', font: 'inherit', fontWeight: 700, width: '100%', color: 'inherit' }}
					>
						{sortOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
			</div>

			<p style={{ margin: '4px 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--pb-muted)' }}>
				{total} clinic{total === 1 ? '' : 's'} found
			</p>

			<div className="pb-grid pb-grid--wide">
				{(clinics === null || (loading && clinics.length === 0)) && <SkeletonCards count={6} />}
				{clinics?.map((clinic, index) => {
					const state = likeState(clinic._id, !!clinic.meLiked?.[0]?.myFavorite, clinic.clinicLikes);
					return (
						<ClinicCard
							key={clinic._id}
							clinic={clinic}
							index={index}
							liked={state.liked}
							likes={state.likes}
							onLike={() => toggleLike(clinic._id, state)}
						/>
					);
				})}
			</div>
			{clinics?.length === 0 && !loading && <p className="pb-empty">No clinics match these filters.</p>}

			{total > input.limit && (
				<div className="pb-pagination">
					<Pagination
						page={input.page}
						count={Math.ceil(total / input.limit)}
						onChange={(e, page) => pushInput({ ...input, page })}
						shape="circular"
						color="primary"
					/>
				</div>
			)}
		</div>
	);
};

export default withPbLayout(ClinicList);
