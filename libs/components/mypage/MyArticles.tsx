import React, { useState } from 'react';
import Link from 'next/link';
import { Pagination } from '@mui/material';
import { useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { Article } from '../../types/article/article';
import { ArticlesInquiry } from '../../types/article/article.input';
import { Direction } from '../../enums/common.enum';
import { T } from '../../types/common';
import { GET_ARTICLES } from '../../../apollo/user/query';
import { LIKE_TARGET_ARTICLE } from '../../../apollo/user/mutation';
import { useLikeToggle } from '../../hooks/useEngagement';
import PostCard from '../cards/PostCard';
import MySection from './MySection';
import { useArticleAccess } from '../../hooks/useArticleAccess';
import { SkeletonCards } from '../ui/Loaders';
import PbPagination from '../ui/PbPagination';

const MyArticles = () => {
	const access = useArticleAccess();
	const user = useReactiveVar(userVar);
	const [input, setInput] = useState<ArticlesInquiry>({ page: 1, limit: 6, sort: 'createdAt', direction: Direction.DESC, search: { memberId: user._id } });
	const [articles, setArticles] = useState<Article[] | null>(null);
	const [total, setTotal] = useState(0);
	const { likeState, toggleLike } = useLikeToggle(LIKE_TARGET_ARTICLE);

	/** APOLLO REQUESTS **/
	useQuery(GET_ARTICLES, {
		fetchPolicy: 'network-only',
		skip: !user._id,
		variables: { input: { ...input, search: { memberId: user._id } } },
		onCompleted: (data: T) => {
			setArticles(data?.getArticles?.list ?? []);
			setTotal(data?.getArticles?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setArticles([]),
	});

	return (
		<MySection
			title="My articles"
			subTitle={`${total} published`}
			actions={
				access.allowed ? (
					<Link href="/mypage?category=writeArticle" className="pb-btn pb-btn--primary pb-btn--sm">
						Write article
					</Link>
				) : undefined
			}
		>
			<div className="pb-grid pb-grid--posts">
				{articles === null && <SkeletonCards count={2} />}
				{articles?.map((article) => {
					const state = likeState(article._id, !!article.meLiked?.[0]?.myFavorite, article.articleLikes);
					return <PostCard key={article._id} article={article} liked={state.liked} likes={state.likes} onLike={() => toggleLike(article._id, state)} />;
				})}
			</div>
			{articles?.length === 0 && <p className="pb-empty">You have not written any article yet.</p>}
			<PbPagination page={input.page} total={total} limit={input.limit} onChange={(page) => setInput({ ...input, page })} noun="article" />
		</MySection>
	);
};

export default MyArticles;
