import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { NextPage } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import moment from 'moment';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import Reviews from '../../libs/components/common/Reviews';
import Avatar from '../../libs/components/ui/Avatar';
import LikeButton, { STAT_ICON } from '../../libs/components/ui/LikeButton';
import { AuthorRole, readMinutes } from '../../libs/components/cards/PostCard';
import { sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import Icon from '../../libs/components/ui/Icon';
import { EcgLine } from '../../libs/components/ui/Loaders';
import { GET_ARTICLE } from '../../apollo/user/query';
import { LIKE_TARGET_ARTICLE } from '../../apollo/user/mutation';
import { useLikeToggle } from '../../libs/hooks/useEngagement';
import { Article } from '../../libs/types/article/article';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { T } from '../../libs/types/common';
import { getMemberName } from '../../libs/config';

const ToastViewer = dynamic(() => import('../../libs/components/community/TViewer'), { ssr: false });

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const CommunityDetail: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const articleId = router.query.id as string | undefined;
	const [article, setArticle] = useState<Article | null>(null);
	const [commentTotal, setCommentTotal] = useState<number | null>(null);
	const { likeState, toggleLike } = useLikeToggle(LIKE_TARGET_ARTICLE);

	/** APOLLO REQUESTS **/
	const { refetch } = useQuery(GET_ARTICLE, {
		fetchPolicy: 'network-only',
		skip: !articleId,
		variables: { input: articleId },
		onCompleted: (data: T) => setArticle(data?.getArticle ?? null),
	});

	if (!article) {
		return (
			<div className="pb-container" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
				<EcgLine />
			</div>
		);
	}

	const author = getMemberName(article.memberData);
	const like = likeState(article._id, !!article.meLiked?.[0]?.myFavorite, article.articleLikes);
	const comments = commentTotal ?? article.articleComments;
	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			await sweetTopSmallSuccessAlert(t('Link copied'), 900);
		} catch {
			// clipboard blocked: nothing to do, the address bar still has the link
		}
	};

	return (
		<div className="pb-container" style={{ maxWidth: 860 }}>
			<div className="pb-back">
				<Link href="/community" className="pb-link">
					<Icon name="arrowLeft" size={16} /> {t('Community')}
				</Link>
			</div>

			<article className="pb-card pb-card--flat pb-in pb-article">
				<header className="pb-article__head">
					<h1 className="pb-title">{article.articleTitle}</h1>
					<div className="pb-article__by">
						<Avatar name={author} image={article.memberData?.memberImage} size={44} />
						<span style={{ minWidth: 0 }}>
							<span className="pb-post__who">
								<Link href={`/member?memberId=${article.memberData?._id}`} className="pb-post__author">
									{author}
								</Link>
								<AuthorRole memberType={article.memberData?.memberType} />
							</span>
							<span className="pb-post__meta">
								{moment(article.createdAt).format('MMMM D, YYYY')} ·{' '}
								{t('{{count}} min read', { count: readMinutes(article.articleContent) })} ·{' '}
								{t('{{count}} views', { count: article.articleViews })}
							</span>
						</span>
					</div>
				</header>

				<ToastViewer markdown={article.articleContent} />

				{/* like, jump to the comments, copy the link */}
				<footer className="pb-article__foot">
					<LikeButton likes={like.likes} liked={like.liked} onLike={() => toggleLike(article._id, like)} />
					<a href="#comments" className="pb-article__comments">
						<Icon name="comment" size={STAT_ICON} />
						{comments === 1 ? t('{{count}} comment', { count: 1 }) : t('{{count}} comments', { count: comments })}
					</a>
					<button type="button" className="pb-article__copy" onClick={copyLink}>
						<Icon name="copy" size={16} />
						{t('Copy link')}
					</button>
				</footer>
			</article>

			<div id="comments" style={{ paddingTop: 20, scrollMarginTop: 96 }}>
				<Reviews
					title="Comments"
					refId={article._id}
					group={CommentGroup.ARTICLE}
					onTotal={setCommentTotal}
					onPosted={() => refetch().then((res) => setArticle(res.data?.getArticle ?? article))}
				/>
			</div>
		</div>
	);
};

export default withPbLayout(CommunityDetail);
