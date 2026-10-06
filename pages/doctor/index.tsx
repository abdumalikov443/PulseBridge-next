import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { Pagination } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import DoctorCard from '../../libs/components/cards/DoctorCard';
import { SkeletonCards } from '../../libs/components/ui/Loaders';
import Icon from '../../libs/components/ui/Icon';
import { GET_DOCTORS } from '../../apollo/user/query';
import { LIKE_TARGET_DOCTOR } from '../../apollo/user/mutation';
import { useFollowing, useLikeToggle } from '../../libs/hooks/useEngagement';
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
	{ value: 'doctorViews', label: 'Most viewed' },
	{ value: 'experience', label: 'Experience' },
	{ value: 'createdAt', label: 'Newest' },
];

const DoctorList: NextPage = () => {
	const router = useRouter();
	const [input, setInput] = useState<DoctorsInquiry>(initialInput);
	const [text, setText] = useState('');
	const [doctors, setDoctors] = useState<Doctor[] | null>(null);
	const [total, setTotal] = useState(0);
	const { isFollowing, canFollow, toggleFollow } = useFollowing();
	const { likeState, toggleLike } = useLikeToggle(LIKE_TARGET_DOCTOR);

	/** APOLLO REQUESTS **/
	const { loading } = useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-and-network',
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

	return (
		<div className="pb-container">
			<header className="pb-page-head">
				<h1 className="pb-title">Find a doctor</h1>
				<p>Only doctors working in an active clinic are listed and can be booked.</p>
			</header>

			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '16px 0' }}>
				<form
					className="pb-search"
					style={{ flex: '1 1 280px' }}
					onSubmit={(e) => {
						e.preventDefault();
						setSearch({ text: text.trim() || undefined });
					}}
				>
					<Icon name="search" />
					<label htmlFor="doctor-search" className="pb-sr">
						Doctor name
					</label>
					<input id="doctor-search" value={text} placeholder="Doctor name" onChange={(e) => setText(e.target.value)} />
				</form>
				<label className="pb-search" style={{ flex: '0 1 220px' }}>
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

			<div className="pb-pills" role="group" aria-label="Specialty">
				<button
					type="button"
					className={`pb-pill ${!specialty ? 'pb-pill--active' : ''}`}
					aria-pressed={!specialty}
					onClick={() => setSearch({ specialtyList: undefined })}
				>
					All
				</button>
				{Object.values(DoctorSpecialty).map((value) => (
					<button
						key={value}
						type="button"
						className={`pb-pill ${specialty === value ? 'pb-pill--active' : ''}`}
						aria-pressed={specialty === value}
						onClick={() => setSearch({ specialtyList: [value] })}
					>
						{formatEnum(value)}
					</button>
				))}
			</div>

			<p style={{ margin: '20px 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--pb-muted)' }}>
				{total} doctor{total === 1 ? '' : 's'} found
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
							following={isFollowing(doctor.memberId)}
							onFollow={canFollow(doctor.memberId) ? () => toggleFollow(doctor.memberId) : undefined}
						/>
					);
				})}
			</div>
			{doctors?.length === 0 && !loading && <p className="pb-empty">No doctors match these filters.</p>}

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

export default withPbLayout(DoctorList);
