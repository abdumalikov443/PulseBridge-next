import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import Reviews from '../../libs/components/common/Reviews';
import DoctorCard from '../../libs/components/cards/DoctorCard';
import LikeButton, { STAT_ICON } from '../../libs/components/ui/LikeButton';
import OpenStatus from '../../libs/components/ui/OpenStatus';
import { sweetActionConfirmAlert } from '../../libs/sweetAlert';
import Icon from '../../libs/components/ui/Icon';
import ClinicMap from '../../libs/components/common/ClinicMap';
import FollowButton from '../../libs/components/ui/FollowButton';
import FollowModal, { FollowMode } from '../../libs/components/common/FollowModal';
import { FollowGroup } from '../../libs/enums/follow.enum';
import { ClinicType } from '../../libs/enums/clinic.enum';
import { WEEK_DAYS, WEEK_DAY_LABEL, withScheduleDefaults, workingDaysText } from '../../libs/schedule';
import { formatCount } from '../../libs/components/ui/ActionChips';
import ClinicJoinButton from '../../libs/components/common/ClinicJoinButton';
import { EcgLine, SkeletonCards } from '../../libs/components/ui/Loaders';
import { GET_CLINIC, GET_DOCTOR_CARDS } from '../../apollo/user/query';
import { LIKE_TARGET_CLINIC, LIKE_TARGET_DOCTOR } from '../../apollo/user/mutation';
import { useFollowing, useLikeToggle } from '../../libs/hooks/useEngagement';
import { Clinic } from '../../libs/types/clinic/clinic';
import { Doctor } from '../../libs/types/doctor/doctor';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { T } from '../../libs/types/common';
import { REACT_APP_API_URL } from '../../libs/config';
import { formatEnum } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

type Tab = 'overview' | 'doctors' | 'reviews';

const ClinicDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const clinicId = router.query.id as string | undefined;
	const [clinic, setClinic] = useState<Clinic | null>(null);
	const [doctors, setDoctors] = useState<Doctor[] | null>(null);
	const [tab, setTab] = useState<Tab>('overview');
	const [commentTotal, setCommentTotal] = useState<number | null>(null);
	const [followDelta, setFollowDelta] = useState(0);
	const [followMode, setFollowMode] = useState<FollowMode | null>(null);
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

	useQuery(GET_DOCTOR_CARDS, {
		fetchPolicy: 'network-only',
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
	const following = isFollowing(clinic._id);
	const schedule = withScheduleDefaults(clinic);
	const followers = (clinic.clinicFollowers ?? 0) + followDelta;
	const followings = clinic.memberData?.memberFollowings ?? 0;
	const callClinic = async (phone: string) => {
		if (
			await sweetActionConfirmAlert(t('Call {{name}} at {{phone}}?', { name: clinic.clinicName, phone }), t('Call'))
		) {
			window.location.href = `tel:${phone}`;
		}
	};
	const tabs: { id: Tab; label: string }[] = [
		{ id: 'overview', label: t('Overview') },
		{ id: 'doctors', label: `${t('Doctors')} (${clinic.clinicDoctors})` },
		{ id: 'reviews', label: `${t('Reviews')} (${commentTotal ?? clinic.clinicComments})` },
	];

	return (
		<div className="pb-container">
			<div className="pb-back">
				<Link href="/clinic" className="pb-link">
					<Icon name="arrowLeft" size={16} /> {t('All clinics')}
				</Link>
			</div>

			<section className="pb-card pb-profile pb-in">
				<div className={`pb-profile__cover ${clinic.clinicImage ? 'has-image' : 'pb-profile__cover--band'}`}>
					{clinic.clinicImage ? (
						<img src={`${REACT_APP_API_URL}/${clinic.clinicImage}`} alt="" />
					) : (
						// no photo: the same heartbeat band as the doctor page
						<svg viewBox="0 0 800 50" preserveAspectRatio="none" aria-hidden="true">
							<path d="M0 28h300l14-20 16 36 14-28 10 12h446" />
						</svg>
					)}
					{/* views: top right corner of the cover, as on the clinic cards */}
					<span className="pb-profile__views" aria-label={t('{{count}} views', { count: clinic.clinicViews })}>
						<Icon name="eye" size={STAT_ICON} />
						{formatCount(clinic.clinicViews)}
					</span>
				</div>
				<div className="pb-profile__body">
					<span className="pb-profile__avatar pb-profile__avatar--clinic" aria-hidden="true">
						<Icon name="clinic" size={44} strokeWidth={1.6} />
					</span>
					<div className="pb-profile__info">
						<div className="pb-profile__title">
							<h1 className="pb-title">{clinic.clinicName}</h1>
							<LikeButton
								likes={like.likes}
								liked={like.liked}
								onLike={() => clinicLike.toggleLike(clinic._id, like)}
							/>
						</div>
						<span className="pb-profile__sub">
							{clinic.clinicType === ClinicType.PUBLIC ? t('Public clinic') : t('Private clinic')}
						</span>
						<span className="pb-profile__meta">
							<Icon name="pin" size={16} />
							{clinic.clinicAddress}
						</span>
						<OpenStatus clinic={clinic} />
					</div>
					<div className="pb-cta pb-profile__cta">
						<ClinicJoinButton
							clinicId={clinic._id}
							clinicName={clinic.clinicName}
							onShowDoctors={() => setTab('doctors')}
						/>
						{canFollow(clinic.memberId) && (
							<FollowButton
								following={following}
								onClick={() => {
									setFollowDelta((delta) => delta + (following ? -1 : 1));
									toggleFollow(FollowGroup.CLINIC, clinic._id);
								}}
							/>
						)}
					</div>
				</div>

				<dl className="pb-profile__stats">
					<div>
						<dt>{t('Doctors')}</dt>
						<dd>
							<button type="button" onClick={() => setTab('doctors')}>
								{formatCount(clinic.clinicDoctors)}
							</button>
						</dd>
					</div>
					<div>
						<dt>{t('Followers')}</dt>
						<dd>
							<button type="button" onClick={() => setFollowMode('followers')}>
								{formatCount(followers)}
							</button>
						</dd>
					</div>
					<div>
						<dt>{t('Reviews')}</dt>
						<dd>
							<button type="button" onClick={() => setTab('reviews')}>
								{formatCount(commentTotal ?? clinic.clinicComments)}
							</button>
						</dd>
					</div>
				</dl>
				<FollowModal
					target={{ followGroup: FollowGroup.CLINIC, refId: clinic._id }}
					memberId={clinic.memberId}
					mode={followMode}
					counts={{ followers, followings }}
					onMode={setFollowMode}
					onClose={() => setFollowMode(null)}
				/>
			</section>

			<div className="pb-pills" role="tablist" aria-label={t('Clinic sections')} style={{ padding: '24px 0 4px' }}>
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
									{t('About')}
								</h2>
								<p className="pb-prose" style={{ whiteSpace: 'pre-line' }}>
									{clinic.clinicDesc}
								</p>
							</section>
							<section className="pb-card pb-card--flat">
								<h2 className="pb-title" style={{ fontSize: 22 }}>
									{t('Location')}
								</h2>
								<ClinicMap address={clinic.clinicAddress} name={clinic.clinicName} />
							</section>
						</>
					)}

					{tab === 'doctors' && (
						// same card as the Reviews tab: title with the count, then the list
						<section className="pb-card pb-card--flat" style={{ gap: 16 }}>
							<div className="pb-section-head" style={{ marginBottom: 0 }}>
								<h2 className="pb-title" style={{ fontSize: 22 }}>
									{t('Doctors')}
								</h2>
								<span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pb-muted)' }}>
									{doctors?.length ?? clinic.clinicDoctors}
								</span>
							</div>
							{doctors === null && <SkeletonCards count={2} />}
							{doctors?.length === 0 && (
								<p style={{ margin: 0, color: 'var(--pb-muted)' }}>{t('No doctors in this clinic yet.')}</p>
							)}
							{!!doctors?.length && (
								<div className="pb-grid">
									{doctors?.map((doctor) => {
										const state = doctorLike.likeState(
											doctor._id,
											!!doctor.meLiked?.[0]?.myFavorite,
											doctor.doctorLikes,
										);
										return (
											<DoctorCard
												key={doctor._id}
												doctor={doctor}
												liked={state.liked}
												likes={state.likes}
												onLike={() => doctorLike.toggleLike(doctor._id, state)}
											/>
										);
									})}
								</div>
							)}
						</section>
					)}

					{tab === 'reviews' && (
						<Reviews
							refId={clinic._id}
							group={CommentGroup.CLINIC}
							onTotal={setCommentTotal}
							ownerMemberId={clinic.memberId}
							onPosted={() => refetchClinic().then((res) => setClinic(res.data?.getClinic ?? clinic))}
						/>
					)}
				</div>

				<aside className="pb-split__side">
					<section className="pb-card pb-card--flat pb-hours pb-side-card">
						<span className="pb-side-card__label">
							<Icon name="clock" size={16} /> {t('Working hours')}
						</span>
						<OpenStatus clinic={clinic} />
						<dl>
							<div>
								<dt>{workingDaysText(schedule.clinicOffDays)}</dt>
								<dd>
									{schedule.clinicOpenTime} – {schedule.clinicCloseTime}
								</dd>
							</div>
							{schedule.clinicBreakStart && schedule.clinicBreakEnd && (
								<div>
									<dt>{t('Break')}</dt>
									<dd>
										{schedule.clinicBreakStart} – {schedule.clinicBreakEnd}
									</dd>
								</div>
							)}
							{schedule.clinicOffDays.length > 0 && (
								<div>
									<dt>{t('Closed')}</dt>
									<dd>
										{WEEK_DAYS.filter((day) => schedule.clinicOffDays.includes(day))
											.map((day) => t(WEEK_DAY_LABEL[day]))
											.join(', ')}
									</dd>
								</div>
							)}
						</dl>
						<small>{t('Seoul time · 30-minute visits')}</small>
					</section>
					{/* the clinic phone; calling asks first, like the 119 button */}
					{clinic.memberData?.memberPhone && (
						<section className="pb-card pb-card--flat pb-side-card">
							<span className="pb-side-card__label">{t('Contact')}</span>
							<button
								type="button"
								className="pb-contact-phone"
								onClick={() => callClinic(clinic.memberData!.memberPhone)}
							>
								<span className="pb-contact-phone__icon">
									<Icon name="phone" size={18} />
								</span>
								<span>
									<small>{t('Phone')}</small>
									<strong>{clinic.memberData.memberPhone}</strong>
								</span>
							</button>
						</section>
					)}
				</aside>
			</div>
		</div>
	);
};

export default withPbLayout(ClinicDetail);
