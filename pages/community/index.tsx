import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useArticleAccess } from '../../libs/hooks/useArticleAccess';
import { useQuery, useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import PostCard from '../../libs/components/cards/PostCard';
import { SkeletonCards } from '../../libs/components/ui/Loaders';
import Icon from '../../libs/components/ui/Icon';
import PbPagination from '../../libs/components/ui/PbPagination';
import { useDebouncedValue } from '../../libs/hooks/useDebouncedValue';
import { userVar } from '../../apollo/store';
import { GET_ARTICLES } from '../../apollo/user/query';
import { LIKE_TARGET_ARTICLE } from '../../apollo/user/mutation';
import { useLikeToggle } from '../../libs/hooks/useEngagement';
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
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const articleAccess = useArticleAccess();
	const [input, setInput] = useState<ArticlesInquiry>({
		page: 1,
		limit: 8,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: {},
	});
	const [text, setText] = useState('');
	const [articles, setArticles] = useState<Article[] | null>(null);
	const [total, setTotal] = useState(0);
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

	// live search: runs after typing stops; an emptied box also resets the sort to "Latest"
	const debouncedText = useDebouncedValue(text, 400);
	useEffect(() => {
		const typed = debouncedText.trim();
		if (typed === (input.search?.text ?? '')) return;
		const search: T = { ...input.search };
		if (typed) search.text = typed;
		else delete search.text;
		if (!typed) {
			setInput({ ...input, page: 1, sort: 'createdAt', search });
			router.replace({ pathname: '/community' }, undefined, { shallow: true, scroll: false });
		} else {
			setInput({ ...input, page: 1, search });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedText]);

	// the newest post opens the first page of "Latest" in a wide card
	const showFeatured =
		input.sort === 'createdAt' && input.page === 1 && !input.search?.text && (articles?.length ?? 0) > 2;

	/** HANDLERS **/
	const changeSort = (sort: string) => {
		setInput({ ...input, page: 1, sort });
		router.replace({ pathname: '/community', query: { sort } }, undefined, { shallow: true, scroll: false });
	};

	return (
		<div className="pb-container">
			<header
				className="pb-page-head"
				style={{
					flexDirection: 'row',
					flexWrap: 'wrap',
					justifyContent: 'space-between',
					alignItems: 'flex-end',
					gap: 16,
				}}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
					<h1 className="pb-title">{t('Community')}</h1>
					<p>{t('Short health notes from doctors and clinics.')}</p>
				</div>
				{articleAccess.allowed && (
					<Link href="/mypage?category=writeArticle" className="pb-btn pb-btn--primary">
						<Icon name="edit" size={16} /> {t('Write a post')}
					</Link>
				)}
			</header>

			{/* same order as the doctor and clinic lists: search, then the tabs, then the count */}
			<form className="pb-search" style={{ margin: '16px 0' }} onSubmit={(e) => e.preventDefault()}>
				<Icon name="search" />
				<label htmlFor="post-search" className="pb-sr">
					{t('Search posts')}
				</label>
				<input
					id="post-search"
					value={text}
					placeholder={t('Search posts')}
					onChange={(e) => setText(e.target.value)}
				/>
			</form>
			<div className="pb-pills" role="tablist" aria-label={t('Sort posts')}>
				{tabs.map((tab) => (
					<button
						key={tab.value}
						type="button"
						role="tab"
						aria-selected={input.sort === tab.value}
						className={`pb-pill ${input.sort === tab.value ? 'pb-pill--active' : ''}`}
						onClick={() => changeSort(tab.value)}
					>
						{t(tab.label)}
					</button>
				))}
			</div>

			<p style={{ margin: '20px 0 12px', minHeight: 20, fontSize: 14, fontWeight: 700, color: 'var(--pb-muted)' }}>
				{articles !== null &&
					!loading &&
					(total === 1 ? t('{{count}} post found', { count: total }) : t('{{count}} posts found', { count: total }))}
			</p>

			<div className="pb-grid pb-grid--posts">
				{(articles === null || (loading && articles.length === 0)) && <SkeletonCards count={4} />}
				{articles?.map((article, index) => {
					const state = likeState(article._id, !!article.meLiked?.[0]?.myFavorite, article.articleLikes);
					return (
						<PostCard
							key={article._id}
							article={article}
							featured={index === 0 && showFeatured}
							liked={state.liked}
							likes={state.likes}
							onLike={() => toggleLike(article._id, state)}
						/>
					);
				})}
			</div>
			{articles?.length === 0 && !loading && <p className="pb-empty">{t('No posts yet.')}</p>}

			<PbPagination
				page={input.page}
				total={total}
				limit={input.limit}
				onChange={(page) => setInput({ ...input, page })}
			/>
		</div>
	);
};

export default withPbLayout(Community);
