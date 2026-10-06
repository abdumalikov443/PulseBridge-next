import React from 'react';
import Link from 'next/link';
import moment from 'moment';
import { Article } from '../../types/article/article';
import { getMemberName } from '../../config';
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

// community post: author with date and read time, title, text, then like / view / comment (images only on the detail page)
const PostCard = ({ article, liked, likes, onLike, following, onFollow }: PostCardProps) => {
	const author = getMemberName(article.memberData);
	const detail = `/community/detail?id=${article._id}`;

	return (
		<article className="pb-card pb-card--hover pb-post">
			<div className="pb-post__by">
				<Avatar name={author} image={article.memberData?.memberImage} size={44} radius={14} />
				<span style={{ flex: 1, minWidth: 0 }}>
					<span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
						<Link href={`/member?memberId=${article.memberData?._id}`} className="pb-post__author">
							{author}
						</Link>
						{article.memberData?.memberType === MemberType.DOCTOR && <span className="pb-badge pb-badge--soft">Doctor</span>}
					</span>
					<span className="pb-post__meta">
						<time dateTime={moment(article.createdAt).toISOString()}>{moment(article.createdAt).format('MMM D, YYYY')}</time> · {readMinutes(article.articleContent)} min read
					</span>
				</span>
				{onFollow && (
					<button type="button" className={`pb-chip ${following ? 'pb-chip--following' : 'pb-chip--follow'}`} aria-pressed={!!following} onClick={onFollow}>
						{following ? 'Following' : 'Follow'}
					</button>
				)}
			</div>
			<Link href={detail} className="pb-post__title">
				{article.articleTitle}
			</Link>
			<p className="pb-post__text">{plainText(article.articleContent)}</p>
			<hr className="pb-post__rule" />
			<div className="pb-post__foot">
				<ActionChips likes={likes} views={article.articleViews} comments={article.articleComments} liked={liked} onLike={onLike} />
				<Link href={detail} className="pb-more">
					Read article <Icon name="arrow" size={16} className="pb-arrow" />
				</Link>
			</div>
		</article>
	);
};

export default PostCard;
