import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Pagination } from '@mui/material';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import PostCard from '../../libs/components/cards/PostCard';
import { SkeletonCards } from '../../libs/components/ui/Loaders';
import Icon from '../../libs/components/ui/Icon';
import { userVar } from '../../apollo/store';
import { GET_ARTICLES } from '../../apollo/user/query';
import { LIKE_TARGET_ARTICLE } from '../../apollo/user/mutation';
import { useFollowing, useLikeToggle } from '../../libs/hooks/useEngagement';
import { Article } from '../../libs/types/article/article';
import { ArticlesInquiry } from '../../libs/types/article/article.input';
import { Direction } from '../../libs/enums/common.enum';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

// articles have no categories: tabs switch the sort order
const tabs = [
	{ value: 'createdAt', label: 'Latest' },
	{ value: 'articleViews', label: 'Popular' },
	{ value: 'articleLikes', label: 'Most liked' },
];

const Community: NextPage = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [input, setInput] = useState<ArticlesInquiry>({ page: 1, limit: 8, sort: 'createdAt', direction: Direction.DESC, search: {} });
	const [text, setText] = useState('');
	const [articles, setArticles] = useState<Article[] | null>(null);
	const [total, setTotal] = useState(0);
	const { isFollowing, canFollow, toggleFollow } = useFollowing();
	const { likeState, toggleLike } = useLikeToggle(LIKE_TARGET_ARTICLE);

	/** APOLLO REQUESTS **/
	const { loading } = useQuery(GET_ARTICLES, {
		fetchPolicy: 'cache-and-network',
		variables: { input },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setArticles(data?.getArticles?.list ?? []);
			setTotal(data?.getArticles?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setArticles([]),
	});

	/** LIFECYCLES **/
	useEffect(() => {
		const sort = router.query.sort as string;
		if (sort && tabs.some((tab) => tab.value === sort)) setInput((prev) => ({ ...prev, page: 1, sort }));
	}, [router.query.sort]);

	/** HANDLERS **/
	const changeSort = (sort: string) => {
		setInput({ ...input, page: 1, sort });
		router.replace({ pathname: '/community', query: { sort } }, undefined, { shallow: true, scroll: false });
	};

	return (
		<div className="pb-container">
			<header className="pb-page-head" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
					<h1 className="pb-title">Community</h1>
					<p>Short health notes and questions from patients and doctors.</p>
				</div>
				<Link href={user._id ? '/mypage?category=writeArticle' : '/account/join'} className="pb-btn pb-btn--primary">
					<Icon name="edit" size={16} /> Write a post
				</Link>
			</header>

			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '16px 0 20px' }}>
				<div className="pb-pills" role="tablist" aria-label="Sort posts" style={{ flex: '1 1 auto' }}>
					{tabs.map((tab) => (
						<button
							key={tab.value}
							type="button"
							role="tab"
							aria-selected={input.sort === tab.value}
							className={`pb-pill ${input.sort === tab.value ? 'pb-pill--active' : ''}`}
							onClick={() => changeSort(tab.value)}
						>
							{tab.label}
						</button>
					))}
				</div>
				<form
					className="pb-search"
					style={{ flex: '1 1 260px', maxWidth: 360 }}
					onSubmit={(e) => {
						e.preventDefault();
						const search: T = { ...input.search, text: text.trim() };
						if (!search.text) delete search.text;
						setInput({ ...input, page: 1, search });
					}}
				>
					<Icon name="search" />
					<label htmlFor="post-search" className="pb-sr">
						Search posts
					</label>
					<input id="post-search" value={text} placeholder="Search posts" onChange={(e) => setText(e.target.value)} />
				</form>
			</div>

			<div className="pb-grid pb-grid--posts">
				{(articles === null || (loading && articles.length === 0)) && <SkeletonCards count={4} />}
				{articles?.map((article) => {
					const state = likeState(article._id, !!article.meLiked?.[0]?.myFavorite, article.articleLikes);
					return (
						<PostCard
							key={article._id}
							article={article}
							liked={state.liked}
							likes={state.likes}
							onLike={() => toggleLike(article._id, state)}
							following={isFollowing(article.memberId)}
							onFollow={canFollow(article.memberId) ? () => toggleFollow(article.memberId) : undefined}
						/>
					);
				})}
			</div>
			{articles?.length === 0 && !loading && <p className="pb-empty">No posts yet.</p>}

			{total > input.limit && (
				<div className="pb-pagination">
					<Pagination page={input.page} count={Math.ceil(total / input.limit)} onChange={(e, page) => setInput({ ...input, page })} shape="circular" color="primary" />
				</div>
			)}
		</div>
	);
};

export default withPbLayout(Community);
