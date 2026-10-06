import React, { useState } from 'react';
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
import ActionChips from '../../libs/components/ui/ActionChips';
import Icon from '../../libs/components/ui/Icon';
import { EcgLine } from '../../libs/components/ui/Loaders';
import { GET_ARTICLE } from '../../apollo/user/query';
import { LIKE_TARGET_ARTICLE } from '../../apollo/user/mutation';
import { useFollowing, useLikeToggle } from '../../libs/hooks/useEngagement';
import { Article } from '../../libs/types/article/article';
import { CommentGroup } from '../../libs/enums/comment.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';
import { getMemberName, REACT_APP_API_URL } from '../../libs/config';

const ToastViewer = dynamic(() => import('../../libs/components/community/TViewer'), { ssr: false });

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const CommunityDetail: NextPage = () => {
	const router = useRouter();
	const articleId = router.query.id as string | undefined;
	const [article, setArticle] = useState<Article | null>(null);
	const [commentTotal, setCommentTotal] = useState<number | null>(null);
	const { isFollowing, canFollow, toggleFollow } = useFollowing();
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
	const following = isFollowing(article.memberId);

	return (
		<div className="pb-container" style={{ maxWidth: 860 }}>
			<div style={{ padding: '24px 0 16px' }}>
				<Link href="/community" className="pb-link" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
					<Icon name="arrowLeft" size={16} /> Community
				</Link>
			</div>

			<article className="pb-card pb-card--flat pb-in" style={{ gap: 18, padding: 28 }}>
				<div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
					<Avatar name={author} image={article.memberData?.memberImage} size={48} />
					<div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
						<span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
							<Link href={`/member?memberId=${article.memberData?._id}`} style={{ fontWeight: 700 }}>
								{author}
							</Link>
							{article.memberData?.memberType === MemberType.DOCTOR && <span className="pb-badge pb-badge--soft">Doctor</span>}
						</span>
						<span style={{ fontSize: 13, color: 'var(--pb-muted)' }}>{moment(article.createdAt).format('MMMM D, YYYY')}</span>
					</div>
					{canFollow(article.memberId) && (
						<button type="button" className={`pb-chip ${following ? 'pb-chip--following' : 'pb-chip--follow'}`} aria-pressed={following} onClick={() => toggleFollow(article.memberId)}>
							<Icon name={following ? 'userCheck' : 'userPlus'} size={16} />
							{following ? 'Following' : 'Follow'}
						</button>
					)}
				</div>

				<h1 className="pb-title" style={{ fontSize: 34 }}>
					{article.articleTitle}
				</h1>

				{article.articleImage && (
					<div className="pb-media" style={{ height: 320 }}>
						<img src={`${REACT_APP_API_URL}/${article.articleImage}`} alt="" />
						<span className="pb-badge">
							<Icon name="calendar" size={14} />
							<time dateTime={moment(article.createdAt).toISOString()}>{moment(article.createdAt).format('MMM D, YYYY · HH:mm')}</time>
						</span>
					</div>
				)}

				<ToastViewer markdown={article.articleContent} />

				<div style={{ paddingTop: 14, borderTop: '1px solid var(--pb-line)' }}>
					<ActionChips likes={like.likes} views={article.articleViews} comments={commentTotal ?? article.articleComments} liked={like.liked} onLike={() => toggleLike(article._id, like)} />
				</div>
			</article>

			<div style={{ paddingTop: 20 }}>
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
