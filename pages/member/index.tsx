import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Pagination } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import FollowModal, { FollowMode } from '../../libs/components/common/FollowModal';
import PostCard from '../../libs/components/cards/PostCard';
import Avatar from '../../libs/components/ui/Avatar';
import Icon from '../../libs/components/ui/Icon';
import JoinRequestReview from '../../libs/components/common/JoinRequestReview';
import { formatCount } from '../../libs/components/ui/ActionChips';
import { EcgLine, SkeletonCards } from '../../libs/components/ui/Loaders';
import { userVar } from '../../apollo/store';
import { GET_ARTICLES, GET_MEMBER } from '../../apollo/user/query';
import { LIKE_TARGET_ARTICLE } from '../../apollo/user/mutation';
import { useLikeToggle } from '../../libs/hooks/useEngagement';
import { Member } from '../../libs/types/member/member';
import { Article } from '../../libs/types/article/article';
import { T } from '../../libs/types/common';
import { getMemberName } from '../../libs/config';
import { formatEnum } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

type Tab = 'articles';
const LIMIT = 6;

const MemberPage: NextPage = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const memberId = router.query.memberId as string | undefined;
	// followers and following open in a popup; ?category=followers still opens it from old links
	const tab: Tab = 'articles';
	const [followMode, setFollowMode] = useState<FollowMode | null>(null);
	const [page, setPage] = useState(1);
	const { likeState, toggleLike } = useLikeToggle(LIKE_TARGET_ARTICLE);

	/** LIFECYCLES **/
	useEffect(() => {
		const category = router.query.category;
		if (category === 'followings') setFollowMode(category);
	}, [router.query.category]);

	useEffect(() => {
		if (memberId && memberId === user._id) router.replace('/mypage');
	}, [memberId, user._id, router]);

	/** APOLLO REQUESTS **/
	// read from data: onCompleted does not always fire here (the page stayed on the loader)
	const { data: memberResult } = useQuery(GET_MEMBER, {
		fetchPolicy: 'network-only',
		skip: !memberId,
		variables: { input: memberId },
	});
	const member: Member | null = memberResult?.getMember ?? null;

	const { data: articleResult, error: articleError } = useQuery(GET_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		skip: !memberId || tab !== 'articles',
		variables: { input: { page, limit: LIMIT, sort: 'createdAt', direction: 'DESC', search: { memberId } } },
	});
	const articles: Article[] | null = articleError ? [] : articleResult?.getArticles?.list ?? null;
	const total: number = articleResult?.getArticles?.metaCounter?.[0]?.total ?? 0;

	if (!member) {
		return (
			<div className="pb-container" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
				<EcgLine />
			</div>
		);
	}

	const name = getMemberName(member);
	const tabs: { id: Tab; label: string }[] = [{ id: 'articles', label: `Articles (${member.memberArticles})` }];
	const followCounts = { followings: member.memberFollowings ?? 0 };
	const stats = [
		{ label: 'Articles', value: member.memberArticles },
		{ label: 'Likes', value: member.memberLikes },
	];

	return (
		<div className="pb-container">
			<section className="pb-card pb-card--flat pb-in" style={{ marginTop: 32, flexDirection: 'row', flexWrap: 'wrap', gap: 24, alignItems: 'center', padding: 28 }}>
				<Avatar name={name} image={member.memberImage} size={104} />
				<div style={{ flex: '999 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
					<div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
						<h1 className="pb-title" style={{ fontSize: 30 }}>
							{name}
						</h1>
						<span className="pb-badge pb-badge--soft">{formatEnum(member.memberType)}</span>
					</div>
					{member.memberDesc && <p style={{ margin: 0, color: 'var(--pb-muted)', lineHeight: 1.6 }}>{member.memberDesc}</p>}
					<div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
						<div className="pb-follow-counts">
							<button type="button" onClick={() => setFollowMode('followings')}>
								<strong>{formatCount(followCounts.followings)}</strong> following
							</button>
						</div>
						{stats.map((stat) => (
							<span key={stat.label} style={{ fontSize: 14, color: 'var(--pb-muted)' }}>
								<strong style={{ color: 'var(--pb-ink)', fontSize: 18 }}>{formatCount(stat.value)}</strong> {stat.label}
							</span>
						))}
					</div>
				</div>
			</section>

			<JoinRequestReview memberId={member._id} />

			<div className="pb-pills" role="tablist" aria-label="Member sections" style={{ padding: '24px 0 16px' }}>
				{tabs.map((item) => (
					<Link
						key={item.id}
						role="tab"
						aria-selected={tab === item.id}
						href={{ pathname: '/member', query: { memberId, category: item.id } }}
						scroll={false}
						className={`pb-pill ${tab === item.id ? 'pb-pill--active' : ''}`}
						style={{ display: 'inline-flex', alignItems: 'center' }}
					>
						{item.label}
					</Link>
				))}
			</div>

			{tab === 'articles' && (
				<>
					<div className="pb-grid pb-grid--posts">
						{articles === null && <SkeletonCards count={2} />}
						{articles?.map((article) => {
							const state = likeState(article._id, !!article.meLiked?.[0]?.myFavorite, article.articleLikes);
							return <PostCard key={article._id} article={article} liked={state.liked} likes={state.likes} onLike={() => toggleLike(article._id, state)} />;
						})}
					</div>
					{articles?.length === 0 && <p className="pb-empty">No articles yet.</p>}
					{total > LIMIT && (
						<div className="pb-pagination">
							<Pagination page={page} count={Math.ceil(total / LIMIT)} onChange={(e, value) => setPage(value)} shape="circular" color="primary" />
						</div>
					)}
				</>
			)}
			<FollowModal memberId={member._id} mode={followMode} counts={followCounts} onMode={setFollowMode} onClose={() => setFollowMode(null)} />
		</div>
	);
};

export default withPbLayout(MemberPage);
