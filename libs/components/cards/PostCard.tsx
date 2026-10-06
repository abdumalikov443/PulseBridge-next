import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { Article } from '../../types/article/article';
import { getMemberName, REACT_APP_API_URL } from '../../config';
import { MemberType } from '../../enums/member.enum';
import Avatar from '../ui/Avatar';
import ActionChips from '../ui/ActionChips';
import Icon from '../ui/Icon';

// article content is short markdown: show it as plain text on cards
export const plainText = (markdown: string = '') =>
	markdown
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s*([-*>]|#+)\s+/gm, '')
		.replace(/[*_`~]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

// about 200 words a minute, at least one minute
export const readMinutes = (markdown: string = '') => Math.max(1, Math.round(plainText(markdown).split(' ').filter(Boolean).length / 200));

interface PostCardProps {
	article: Article;
	liked: boolean;
	likes: number;
	onLike: () => void;
	following?: boolean;
	onFollow?: () => void;
}

// community post: comment, like and view, plus follow for the author
const PostCard = ({ article, liked, likes, onLike, following, onFollow }: PostCardProps) => {
	const author = getMemberName(article.memberData);
	const detail = `/community/detail?id=${article._id}`;

	return (
		<article className="pb-card pb-card--hover" style={{ flexDirection: 'row', gap: 12, padding: '18px 18px 14px' }}>
			<Avatar name={author} image={article.memberData?.memberImage} size={44} />
			<div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
					<span style={{ fontSize: 14, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
						<Link href={`/member?memberId=${article.memberData?._id}`} style={{ fontWeight: 700 }}>
							{author}
						</Link>
						{article.memberData?.memberType === MemberType.DOCTOR && <span className="pb-badge pb-badge--soft">Doctor</span>}
						<span style={{ color: 'var(--pb-muted)' }}>
							· {moment(article.createdAt).format('MMM D')} · {readMinutes(article.articleContent)} min read
						</span>
					</span>
					{onFollow && (
						<button
							type="button"
							className={`pb-chip ${following ? 'pb-chip--following' : 'pb-chip--follow'}`}
							aria-pressed={!!following}
							onClick={onFollow}
						>
							{following ? 'Following' : 'Follow'}
						</button>
					)}
				</div>
				<Link href={detail} style={{ fontSize: 16, fontWeight: 700 }}>
					{article.articleTitle}
				</Link>
				<p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--pb-muted)' }}>{plainText(article.articleContent)}</p>
				{article.articleImage && (
					<Link href={detail} className="pb-media pb-post-media" aria-label={article.articleTitle}>
						<img src={`${REACT_APP_API_URL}/${article.articleImage}`} alt="" loading="lazy" />
						<span className="pb-badge">
							<Icon name="calendar" size={14} />
							<time dateTime={moment(article.createdAt).toISOString()}>{moment(article.createdAt).format('MMM D, YYYY · HH:mm')}</time>
						</span>
					</Link>
				)}
				<div style={{ paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
					<ActionChips
						likes={likes}
						views={article.articleViews}
						comments={article.articleComments}
						liked={liked}
						onLike={onLike}
					/>
					<Link href={detail} className="pb-more">
						Read article <Icon name="arrow" size={16} className="pb-arrow" />
					</Link>
				</div>
			</div>
		</article>
	);
};

export default PostCard;
