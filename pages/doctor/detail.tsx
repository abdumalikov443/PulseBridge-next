import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import Reviews from '../../libs/components/common/Reviews';
import Avatar from '../../libs/components/ui/Avatar';
import LikeButton from '../../libs/components/ui/LikeButton';
import OpenStatus from '../../libs/components/ui/OpenStatus';
import { sweetActionConfirmAlert } from '../../libs/sweetAlert';
import { dayLabel, isTomorrow } from '../../libs/schedule';
import Icon from '../../libs/components/ui/Icon';
import FollowButton from '../../libs/components/ui/FollowButton';
import FollowModal, { FollowMode } from '../../libs/components/common/FollowModal';
import { FollowGroup } from '../../libs/enums/follow.enum';
import { formatCount } from '../../libs/components/ui/ActionChips';
import { EcgLine } from '../../libs/components/ui/Loaders';
import { userVar } from '../../apollo/store';
import { GET_ARTICLES, GET_DOCTOR } from '../../apollo/user/query';
import { LIKE_TARGET_DOCTOR } from '../../apollo/user/mutation';
import { useFollowing, useLikeToggle } from '../../libs/hooks/useEngagement';
import { Doctor } from '../../libs/types/doctor/doctor';
import { Article } from '../../libs/types/article/article';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';
import { getMemberName } from '../../libs/config';
import { formatEnum } from '../../libs/utils';
import { SPECIALTY_INFO } from '../../libs/specialty';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const DoctorDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const doctorId = router.query.id as string | undefined;
	const [doctor, setDoctor] = useState<Doctor | null>(null);
	const [articles, setArticles] = useState<Article[]>([]);
	const [commentTotal, setCommentTotal] = useState<number | null>(null);
	// follow toggles made on this page move the followers count
	const [followDelta, setFollowDelta] = useState(0);
	const [followMode, setFollowMode] = useState<FollowMode | null>(null);
	const { isFollowing, canFollow, toggleFollow } = useFollowing();
	const { likeState, toggleLike } = useLikeToggle(LIKE_TARGET_DOCTOR);

	/** APOLLO REQUESTS **/
	const { refetch: refetchDoctor } = useQuery(GET_DOCTOR, {
		fetchPolicy: 'network-only',
		skip: !doctorId,
		variables: { input: doctorId },
		onCompleted: (data: T) => setDoctor(data?.getDoctor ?? null),
	});

	useQuery(GET_ARTICLES, {
		fetchPolicy: 'network-only',
		skip: !doctor?.memberId,
		variables: {
			input: { page: 1, limit: 3, sort: 'createdAt', direction: 'DESC', search: { memberId: doctor?.memberId } },
		},
		onCompleted: (data: T) => setArticles(data?.getArticles?.list ?? []),
	});

	if (!doctor) {
		return (
			<div className="pb-container" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
				<EcgLine />
			</div>
		);
	}

	const name = getMemberName(doctor.memberData);
	const like = likeState(doctor._id, !!doctor.meLiked?.[0]?.myFavorite, doctor.doctorLikes);
	const following = isFollowing(doctor._id);
	const followers = (doctor.doctorFollowers ?? 0) + followDelta;
	const followings = doctor.memberData?.memberFollowings ?? 0;
	const canBook = !user?._id || user.memberType === MemberType.PATIENT;

	const tone = SPECIALTY_INFO[doctor.specialty]?.tone ?? 'blue';
	const reviews = commentTotal ?? doctor.doctorComments;
	const next = doctor.nextAvailable;
	const callDoctor = async (phone: string) => {
		if (
			await sweetActionConfirmAlert(t('Call {{name}} at {{phone}}?', { name: `${t('Dr.')} ${name}`, phone }), t('Call'))
		) {
			window.location.href = `tel:${phone}`;
		}
	};

	return (
		<div className="pb-container">
			<div className="pb-back">
				<Link href="/doctor" className="pb-link">
					<Icon name="arrowLeft" size={16} /> {t('All doctors')}
				</Link>
			</div>

			<section className={`pb-card pb-profile pb-in pb-spec--${tone}`}>
				{/* band in the color of the doctor's specialty, with a heartbeat line */}
				<div className="pb-profile__cover pb-profile__cover--band" aria-hidden="true">
					<svg viewBox="0 0 800 50" preserveAspectRatio="none">
						<path d="M0 28h300l14-20 16 36 14-28 10 12h446" />
					</svg>
				</div>
				<div className="pb-profile__body">
					<span className="pb-profile__avatar">
						<Avatar name={name} image={doctor.memberData?.memberImage} size={112} radius={30} />
					</span>
					<div className="pb-profile__info">
						<div className="pb-profile__title">
							<h1 className="pb-title">
								{t('Dr.')} {name}
							</h1>
							<LikeButton likes={like.likes} liked={like.liked} onLike={() => toggleLike(doctor._id, like)} />
						</div>
						<span className="pb-profile__sub">{formatEnum(doctor.specialty)}</span>
						{doctor.clinicData && (
							<Link href={`/clinic/detail?id=${doctor.clinicData._id}`} className="pb-profile__meta pb-link">
								<Icon name="clinic" size={16} />
								{doctor.clinicData.clinicName}
							</Link>
						)}
					</div>
					{(canBook || canFollow(doctor.memberId)) && (
						<div className="pb-cta pb-profile__cta">
							{canBook && (
								<Link
									href={`/booking?doctorId=${doctor._id}`}
									className="pb-btn pb-btn--primary pb-btn--lg pb-btn--block"
								>
									<Icon name="calendar" size={18} />
									{t('Book an appointment')}
								</Link>
							)}
							{canFollow(doctor.memberId) && (
								<FollowButton
									following={following}
									onClick={() => {
										setFollowDelta((delta) => delta + (following ? -1 : 1));
										toggleFollow(FollowGroup.DOCTOR, doctor._id);
									}}
								/>
							)}
						</div>
					)}
				</div>

				{/* the numbers a patient compares doctors by; followers opens the list */}
				<dl className="pb-profile__stats">
					<div>
						<dt>{t('Experience')}</dt>
						<dd>
							{doctor.experience} <small>{t('yrs')}</small>
						</dd>
					</div>
					<div>
						<dt>{t('Patients served')}</dt>
						<dd>{formatCount(doctor.patientsServed ?? 0)}</dd>
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
						<dd>{formatCount(reviews)}</dd>
					</div>
				</dl>
				<FollowModal
					target={{ followGroup: FollowGroup.DOCTOR, refId: doctor._id }}
					memberId={doctor.memberId}
					mode={followMode}
					counts={{ followers, followings }}
					onMode={setFollowMode}
					onClose={() => setFollowMode(null)}
				/>
			</section>

			<div className="pb-split" style={{ paddingTop: 24 }}>
				<div className="pb-split__main">
					<section className="pb-card pb-card--flat">
						<h2 className="pb-title" style={{ fontSize: 22 }}>
							{t('About')}
						</h2>
						<p className="pb-prose">
							{doctor.memberData?.memberDesc ||
								t('{{name}} is a {{specialty}} doctor with {{count}} years of experience.', {
									name,
									specialty: formatEnum(doctor.specialty).toLowerCase(),
									count: doctor.experience,
								})}
						</p>
					</section>
					<Reviews
						refId={doctor._id}
						group={CommentGroup.DOCTOR}
						onTotal={setCommentTotal}
						ownerMemberId={doctor.memberId}
						onPosted={() => refetchDoctor().then((res) => setDoctor(res.data?.getDoctor ?? doctor))}
					/>
				</div>

				<aside className="pb-split__side pb-profile__side">
					{/* first free slot; the booking page shows every time */}
					{next !== undefined && (
						<section className="pb-card pb-card--flat pb-side-card">
							<span className="pb-side-card__label">
								<Icon name="calendar" size={16} /> {t('Next available')}
							</span>
							{next ? (
								<strong className={`pb-slot-tag ${isTomorrow(next.date) ? '' : 'is-later'}`}>
									{dayLabel(next.date)}, {next.time}
								</strong>
							) : (
								<strong className="pb-slot-tag is-none">{t('No free time')}</strong>
							)}
							{canBook && next && (
								<Link href={`/booking?doctorId=${doctor._id}`} className="pb-more">
									{t('See all times')} <Icon name="arrow" size={14} className="pb-arrow" />
								</Link>
							)}
						</section>
					)}

					{doctor.clinicData && (
						<Link
							href={`/clinic/detail?id=${doctor.clinicData._id}`}
							className="pb-card pb-card--flat pb-card--hover pb-side-card"
						>
							<span className="pb-side-card__label">{t('Works at')}</span>
							<span className="pb-side-card__row">
								<span className="pb-side-card__icon">
									<Icon name="clinic" size={22} />
								</span>
								<span style={{ minWidth: 0 }}>
									<strong>{doctor.clinicData.clinicName}</strong>
									<small>
										{formatEnum(doctor.clinicData.clinicType)} · {doctor.clinicData.clinicAddress}
									</small>
								</span>
							</span>
							<OpenStatus clinic={doctor.clinicData} />
						</Link>
					)}

					{doctor.memberData?.memberPhone && (
						<section className="pb-card pb-card--flat pb-side-card">
							<span className="pb-side-card__label">{t('Contact')}</span>
							<button
								type="button"
								className="pb-contact-phone"
								onClick={() => callDoctor(doctor.memberData!.memberPhone)}
							>
								<span className="pb-contact-phone__icon">
									<Icon name="phone" size={18} />
								</span>
								<span>
									<small>{t('Phone')}</small>
									<strong>{doctor.memberData.memberPhone}</strong>
								</span>
							</button>
						</section>
					)}

					{articles.length > 0 && (
						<section className="pb-card pb-card--flat pb-side-card">
							<span className="pb-side-card__label">{t('Articles by {{name}}', { name })}</span>
							{articles.map((article) => (
								<Link key={article._id} href={`/community/detail?id=${article._id}`} className="pb-side-card__article">
									<Icon name="book" size={16} />
									{article.articleTitle}
								</Link>
							))}
						</section>
					)}
				</aside>
			</div>
		</div>
	);
};

export default withPbLayout(DoctorDetail);
