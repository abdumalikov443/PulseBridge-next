import React, { useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import moment from 'moment';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import Reviews from '../../libs/components/common/Reviews';
import DoctorCard from '../../libs/components/cards/DoctorCard';
import Avatar from '../../libs/components/ui/Avatar';
import ActionChips from '../../libs/components/ui/ActionChips';
import Icon from '../../libs/components/ui/Icon';
import { EcgLine, SkeletonCards } from '../../libs/components/ui/Loaders';
import { GET_CLINIC, GET_DOCTORS } from '../../apollo/user/query';
import { LIKE_TARGET_CLINIC, LIKE_TARGET_DOCTOR } from '../../apollo/user/mutation';
import { useFollowing, useLikeToggle } from '../../libs/hooks/useEngagement';
import { Clinic } from '../../libs/types/clinic/clinic';
import { Doctor } from '../../libs/types/doctor/doctor';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { T } from '../../libs/types/common';
import { getMemberName, REACT_APP_API_URL } from '../../libs/config';
import { formatEnum } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

type Tab = 'overview' | 'doctors' | 'reviews';

const ClinicDetail: NextPage = () => {
	const router = useRouter();
	const clinicId = router.query.id as string | undefined;
	const [clinic, setClinic] = useState<Clinic | null>(null);
	const [doctors, setDoctors] = useState<Doctor[] | null>(null);
	const [tab, setTab] = useState<Tab>('overview');
	const [followDelta, setFollowDelta] = useState(0);
	const { isFollowing, canFollow, toggleFollow } = useFollowing();
	const clinicLike = useLikeToggle(LIKE_TARGET_CLINIC);
	const doctorLike = useLikeToggle(LIKE_TARGET_DOCTOR);

	/** APOLLO REQUESTS **/
	const { refetch: refetchClinic } = useQuery(GET_CLINIC, {
		fetchPolicy: 'network-only',
		skip: !clinicId,
		variables: { input: clinicId },
		onCompleted: (data: T) => setClinic(data?.getClinic ?? null),
	});

	useQuery(GET_DOCTORS, {
		fetchPolicy: 'cache-and-network',
		skip: !clinicId,
		variables: { input: { page: 1, limit: 30, sort: 'doctorRank', direction: 'DESC', search: { clinicId } } },
		onCompleted: (data: T) => setDoctors(data?.getDoctors?.list ?? []),
		onError: () => setDoctors([]),
	});

	if (!clinic) {
		return (
			<div className="pb-container" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
				<EcgLine />
			</div>
		);
	}

	const like = clinicLike.likeState(clinic._id, !!clinic.meLiked?.[0]?.myFavorite, clinic.clinicLikes);
	const following = isFollowing(clinic.memberId);
	const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(clinic.clinicAddress)}`;
	const tabs: { id: Tab; label: string }[] = [
		{ id: 'overview', label: 'Overview' },
		{ id: 'doctors', label: `Doctors (${clinic.clinicDoctors})` },
		{ id: 'reviews', label: `Reviews (${clinic.clinicComments})` },
	];

	return (
		<div className="pb-container">
			<div style={{ padding: '24px 0 16px' }}>
				<Link href="/clinic" className="pb-link" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
					<Icon name="arrowLeft" size={16} /> All clinics
				</Link>
			</div>

			<div className="pb-media pb-in" style={{ height: 260, borderRadius: 32, background: 'var(--pb-soft-1)' }}>
				{clinic.clinicImage ? (
					<img src={`${REACT_APP_API_URL}/${clinic.clinicImage}`} alt="" style={{ animation: 'pbZoom 1.6s cubic-bezier(.2,.8,.2,1) both' }} />
				) : (
					<span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(31,111,153,.4)' }}>
						<Icon name="clinic" size={72} strokeWidth={1.3} />
					</span>
				)}
			</div>

			<section
				className="pb-card pb-card--flat"
				style={{ margin: '-48px 24px 0', position: 'relative', flexDirection: 'row', flexWrap: 'wrap', gap: 20, alignItems: 'center', boxShadow: 'var(--pb-shadow)' }}
			>
				<div style={{ flex: '999 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
					<div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
						<h1 className="pb-title" style={{ fontSize: 32 }}>
							{clinic.clinicName}
						</h1>
						<span className="pb-badge pb-badge--soft">{formatEnum(clinic.clinicType)}</span>
					</div>
					<span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 15, color: 'var(--pb-muted)' }}>
						<Icon name="pin" size={16} /> {clinic.clinicAddress} · since {moment(clinic.createdAt).format('YYYY')}
					</span>
					<ActionChips
						likes={like.likes}
						views={clinic.clinicViews}
						comments={clinic.clinicComments}
						followers={(clinic.memberData?.memberFollowers ?? 0) + followDelta}
						liked={like.liked}
						onLike={() => clinicLike.toggleLike(clinic._id, like)}
						following={following}
						onFollow={
							canFollow(clinic.memberId)
								? () => {
										setFollowDelta((delta) => delta + (following ? -1 : 1));
										toggleFollow(clinic.memberId);
								  }
								: undefined
						}
					/>
				</div>
				<button type="button" className="pb-btn pb-btn--primary pb-btn--lg" onClick={() => setTab('doctors')}>
					Choose a doctor <Icon name="arrow" className="pb-arrow" />
				</button>
			</section>

			<div className="pb-pills" role="tablist" aria-label="Clinic sections" style={{ padding: '24px 0 4px' }}>
				{tabs.map((item) => (
					<button
						key={item.id}
						type="button"
						role="tab"
						aria-selected={tab === item.id}
						className={`pb-pill ${tab === item.id ? 'pb-pill--active' : ''}`}
						onClick={() => setTab(item.id)}
					>
						{item.label}
					</button>
				))}
			</div>

			<div className="pb-split" style={{ paddingTop: 16 }}>
				<div className="pb-split__main">
					{tab === 'overview' && (
						<>
							<section className="pb-card pb-card--flat">
								<h2 className="pb-title" style={{ fontSize: 22 }}>
									About
								</h2>
								<p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'var(--pb-muted)', whiteSpace: 'pre-line' }}>{clinic.clinicDesc}</p>
							</section>
							<section className="pb-card pb-card--flat">
								<h2 className="pb-title" style={{ fontSize: 22 }}>
									Location
								</h2>
								<a href={mapsUrl} target="_blank" rel="noreferrer" className="pb-media" style={{ height: 180, background: 'var(--pb-soft-1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--pb-deep)' }}>
									<Icon name="pin" size={32} />
									<span style={{ fontWeight: 700 }}>{clinic.clinicAddress}</span>
									<span style={{ fontSize: 13 }}>Open in Google Maps</span>
								</a>
							</section>
						</>
					)}

					{tab === 'doctors' && (
						<div className="pb-grid">
							{doctors === null && <SkeletonCards count={3} />}
							{doctors?.length === 0 && <p className="pb-empty">No doctors in this clinic yet.</p>}
							{doctors?.map((doctor) => {
								const state = doctorLike.likeState(doctor._id, !!doctor.meLiked?.[0]?.myFavorite, doctor.doctorLikes);
								return (
									<DoctorCard
										key={doctor._id}
										doctor={doctor}
										liked={state.liked}
										likes={state.likes}
										onLike={() => doctorLike.toggleLike(doctor._id, state)}
										following={isFollowing(doctor.memberId)}
										onFollow={canFollow(doctor.memberId) ? () => toggleFollow(doctor.memberId) : undefined}
									/>
								);
							})}
						</div>
					)}

					{tab === 'reviews' && (
						<Reviews
							refId={clinic._id}
							group={CommentGroup.CLINIC}
							ownerMemberId={clinic.memberId}
							onPosted={() => refetchClinic().then((res) => setClinic(res.data?.getClinic ?? clinic))}
						/>
					)}
				</div>

				<aside className="pb-split__side">
					<section className="pb-card pb-card--flat">
						<strong style={{ fontSize: 15 }}>Contact</strong>
						<span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
							<Avatar name={getMemberName(clinic.memberData) || clinic.clinicName} image={clinic.memberData?.memberImage} size={44} />
							<span style={{ display: 'flex', flexDirection: 'column' }}>
								<strong style={{ fontSize: 14 }}>{getMemberName(clinic.memberData)}</strong>
								{clinic.memberData?.memberPhone && (
									<a href={`tel:${clinic.memberData.memberPhone}`} style={{ fontSize: 13, color: 'var(--pb-muted)' }}>
										{clinic.memberData.memberPhone}
									</a>
								)}
							</span>
						</span>
					</section>
				</aside>
			</div>
		</div>
	);
};

export default withPbLayout(ClinicDetail);
