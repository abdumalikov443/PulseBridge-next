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
import ActionChips from '../../libs/components/ui/ActionChips';
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
		fetchPolicy: 'cache-and-network',
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

	return (
		<div className="pb-container">
			<div style={{ padding: '24px 0 16px' }}>
				<Link href="/doctor" className="pb-link" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
					<Icon name="arrowLeft" size={16} /> {t('All doctors')}
				</Link>
			</div>

			<section
				className="pb-card pb-card--flat pb-in"
				style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 28, alignItems: 'center', padding: 28 }}
			>
				<Avatar name={name} image={doctor.memberData?.memberImage} size={120} />
				<div style={{ flex: '999 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
					<h1 className="pb-title" style={{ fontSize: 34 }}>
						{name}
					</h1>
					<span className="pb-spec-tag">
						<b aria-hidden="true">#</b>
						{formatEnum(doctor.specialty)}
					</span>
					<span style={{ fontSize: 16, color: 'var(--pb-muted)' }}>
						{t('{{count}} years of experience', { count: doctor.experience })}
						{doctor.clinicData && (
							<>
								{' · '}
								<Link href={`/clinic/detail?id=${doctor.clinicData._id}`} className="pb-link">
									{doctor.clinicData.clinicName}
								</Link>
							</>
						)}
					</span>
					{doctor.memberData?.memberPhone && (
						<span
							style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 14, color: 'var(--pb-muted)' }}
						>
							<Icon name="phone" size={16} /> {doctor.memberData.memberPhone}
						</span>
					)}
					<ActionChips
						likes={like.likes}
						views={doctor.doctorViews}
						comments={commentTotal ?? doctor.doctorComments}
						liked={like.liked}
						onLike={() => toggleLike(doctor._id, like)}
					/>
					<div className="pb-follow-counts">
						<button type="button" onClick={() => setFollowMode('followers')}>
							<strong>{formatCount(followers)}</strong> {followers === 1 ? t('follower') : t('followers')}
						</button>
						<button type="button" onClick={() => setFollowMode('followings')}>
							<strong>{formatCount(followings)}</strong> {t('following')}
						</button>
					</div>
					<FollowModal
						target={{ followGroup: FollowGroup.DOCTOR, refId: doctor._id }}
						memberId={doctor.memberId}
						mode={followMode}
						counts={{ followers, followings }}
						onMode={setFollowMode}
						onClose={() => setFollowMode(null)}
					/>
				</div>
				{(canBook || canFollow(doctor.memberId)) && (
					<div className="pb-cta">
						{canBook && (
							<Link
								href={`/booking?doctorId=${doctor._id}`}
								className="pb-btn pb-btn--primary pb-btn--lg pb-btn--block"
							>
								{t('Book an appointment')} <Icon name="arrow" className="pb-arrow" />
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
			</section>

			<div className="pb-split" style={{ paddingTop: 24 }}>
				<div className="pb-split__main">
					<section className="pb-card pb-card--flat">
						<h2 className="pb-title" style={{ fontSize: 22 }}>
							{t('About')}
						</h2>
						<p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'var(--pb-muted)' }}>
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

				<aside className="pb-split__side">
					{doctor.clinicData && (
						<Link href={`/clinic/detail?id=${doctor.clinicData._id}`} className="pb-card pb-card--flat pb-card--hover">
							<span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pb-muted)' }}>{t('Works at')}</span>
							<span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
								<span
									className="pb-avatar"
									style={{
										width: 48,
										height: 48,
										borderRadius: 14,
										background: 'var(--pb-soft-1)',
										color: 'var(--pb-deep)',
									}}
								>
									<Icon name="clinic" size={24} />
								</span>
								<span style={{ display: 'flex', flexDirection: 'column' }}>
									<strong>{doctor.clinicData.clinicName}</strong>
									<span style={{ fontSize: 13, color: 'var(--pb-muted)' }}>
										{formatEnum(doctor.clinicData.clinicType)} · {doctor.clinicData.clinicAddress}
									</span>
								</span>
							</span>
						</Link>
					)}
					{articles.length > 0 && (
						<section className="pb-card pb-card--flat">
							<strong style={{ fontSize: 15 }}>{t('Articles by {{name}}', { name })}</strong>
							{articles.map((article) => (
								<Link
									key={article._id}
									href={`/community/detail?id=${article._id}`}
									className="pb-link"
									style={{ color: 'var(--pb-ink)' }}
								>
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
