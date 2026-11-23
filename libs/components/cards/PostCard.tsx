import React from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import moment from 'moment';
import { Article } from '../../types/article/article';
import { getMemberName } from '../../config';
import { MemberType } from '../../enums/member.enum';
import Avatar from '../ui/Avatar';
import { formatCount } from '../ui/ActionChips';
import LikeButton, { STAT_ICON } from '../ui/LikeButton';
import Icon from '../ui/Icon';

// article content is short markdown: show it as plain text on cards
export const plainText = (markdown: string = '') =>
	markdown
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		// a heading runs into the next sentence otherwise: "What helps: Dress warmly…"
		.replace(/^\s*#+\s+(.+?)\s*$/gm, '$1:')
		.replace(/^\s*([-*>]|#+)\s+/gm, '')
		.replace(/[*_`~]/g, '')
		.replace(/\s+/g, ' ')
		.trim();

// about 200 words a minute, at least one minute
export const readMinutes = (markdown: string = '') =>
	Math.max(1, Math.round(plainText(markdown).split(' ').filter(Boolean).length / 200));

// "Doctor" / "Clinic" next to an author name (patients get none)
export const AuthorRole = ({ memberType }: { memberType?: string }) => {
	const { t } = useTranslation('common');
	if (memberType === MemberType.DOCTOR) return <span className="pb-author-role">{t('Doctor')}</span>;
	if (memberType === MemberType.CLINIC)
		return <span className="pb-author-role pb-author-role--clinic">{t('Clinic')}</span>;
	return null;
};

interface PostCardProps {
	article: Article;
	liked: boolean;
	likes: number;
	onLike: () => void;
	// the first post of the community list: spans the row with a larger title and more text
	featured?: boolean;
}

// community post: author with date and read time and the like button, title, text, then views / comments
// and the link (images only on the article page)
const PostCard = ({ article, liked, likes, onLike, featured }: PostCardProps) => {
	const { t } = useTranslation('common');
	const author = getMemberName(article.memberData);
	const detail = `/community/detail?id=${article._id}`;

	return (
		<article className={`pb-card pb-card--hover pb-post ${featured ? 'pb-post--featured' : ''}`}>
			<div className="pb-post__by">
				<Avatar name={author} image={article.memberData?.memberImage} size={42} radius={14} />
				<span style={{ flex: 1, minWidth: 0 }}>
					<span className="pb-post__who">
						<Link href={`/member?memberId=${article.memberData?._id}`} className="pb-post__author">
							{author}
						</Link>
						<AuthorRole memberType={article.memberData?.memberType} />
					</span>
					<span className="pb-post__meta">
						<time dateTime={moment(article.createdAt).toISOString()}>
							{moment(article.createdAt).format('MMM D, YYYY')}
						</time>{' '}
						· {t('{{count}} min read', { count: readMinutes(article.articleContent) })}
					</span>
				</span>
				<LikeButton likes={likes} liked={liked} onLike={onLike} />
			</div>
			<Link href={detail} className="pb-post__title">
				{article.articleTitle}
			</Link>
			<p className="pb-post__text">{plainText(article.articleContent)}</p>
			<div className="pb-post__foot">
				<span className="pb-post__stats">
					<span className="pb-meta-stat" aria-label={t('{{count}} views', { count: article.articleViews })}>
						<Icon name="eye" size={STAT_ICON} />
						{formatCount(article.articleViews)}
					</span>
					<span className="pb-meta-stat" aria-label={t('{{count}} comments', { count: article.articleComments })}>
						<Icon name="comment" size={STAT_ICON} />
						{formatCount(article.articleComments)}
					</span>
				</span>
				<Link href={detail} className="pb-more">
					{t('Read article')} <Icon name="arrow" size={16} className="pb-arrow" />
				</Link>
			</div>
		</article>
	);
};

export default PostCard;
