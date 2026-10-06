import React, { useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { Pagination } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_COMMENTS } from '../../../apollo/user/query';
import { CREATE_COMMENT } from '../../../apollo/user/mutation';
import { CommentGroup } from '../../enums/comment.enum';
import { Comment } from '../../types/comment/comment';
import { T } from '../../types/common';
import { COMMENT_CONTENT_MAX, getMemberName, Messages } from '../../config';
import { sweetErrorHandling } from '../../sweetAlert';
import Avatar from '../ui/Avatar';
import { EcgLine } from '../ui/Loaders';

interface ReviewsProps {
	refId: string;
	group: CommentGroup;
	// the doctor or clinic owner cannot review themselves
	ownerMemberId?: string;
	onPosted?: () => void;
}

const LIMIT = 5;

const Reviews = ({ refId, group, ownerMemberId, onPosted }: ReviewsProps) => {
	const user = useReactiveVar(userVar);
	const [page, setPage] = useState(1);
	const [text, setText] = useState('');
	const [comments, setComments] = useState<Comment[]>([]);
	const [total, setTotal] = useState(0);

	/** APOLLO REQUESTS **/
	const [createComment, { loading: posting }] = useMutation(CREATE_COMMENT);
	const { refetch } = useQuery(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		skip: !refId,
		variables: { input: { page, limit: LIMIT, sort: 'createdAt', direction: 'DESC', search: { commentRefId: refId } } },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setComments(data?.getComments?.list ?? []);
			setTotal(data?.getComments?.metaCounter?.[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/
	const isOwner = !!ownerMemberId && ownerMemberId === user?._id;

	const submitHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!text.trim()) return;
			await createComment({ variables: { input: { commentGroup: group, commentRefId: refId, commentContent: text.trim() } } });
			setText('');
			setPage(1);
			await refetch();
			onPosted && onPosted();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<section className="pb-card pb-card--flat" style={{ gap: 16 }}>
			<div className="pb-section-head" style={{ marginBottom: 0 }}>
				<h2 className="pb-title" style={{ fontSize: 22 }}>
					Reviews
				</h2>
				<span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pb-muted)' }}>{total} total</span>
			</div>

			{!isOwner && (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						submitHandler();
					}}
					style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 16, borderRadius: 16, background: 'var(--pb-bg)' }}
				>
					<label htmlFor={`review-${refId}`} style={{ fontSize: 13, fontWeight: 700 }}>
						Leave a review
					</label>
					<textarea
						id={`review-${refId}`}
						className="pb-textarea"
						rows={2}
						maxLength={COMMENT_CONTENT_MAX}
						placeholder={user?._id ? 'Share your experience' : 'Log in to leave a review'}
						disabled={!user?._id}
						value={text}
						onChange={(e) => setText(e.target.value)}
					/>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: 'var(--pb-muted)' }}>
							{text.length} / {COMMENT_CONTENT_MAX}
						</span>
						{user?._id ? (
							<button type="submit" className="pb-btn pb-btn--primary pb-btn--sm" disabled={!text.trim() || posting}>
								{posting ? <EcgLine small width={44} /> : 'Post review'}
							</button>
						) : (
							<Link href="/account/join" className="pb-btn pb-btn--outline pb-btn--sm">
								Log in
							</Link>
						)}
					</div>
				</form>
			)}

			{comments.length === 0 && <p style={{ margin: 0, color: 'var(--pb-muted)' }}>No reviews yet.</p>}
			{comments.map((comment) => {
				const author = getMemberName(comment.memberData);
				return (
					<article key={comment._id} style={{ display: 'flex', gap: 12, paddingTop: 14, borderTop: '1px solid var(--pb-line)' }}>
						<Avatar name={author} image={comment.memberData?.memberImage} size={40} />
						<div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
							<span style={{ fontSize: 14 }}>
								<Link href={`/member?memberId=${comment.memberData?._id}`} style={{ fontWeight: 700 }}>
									{author}
								</Link>{' '}
								<span style={{ color: 'var(--pb-muted)' }}>· {moment(comment.createdAt).format('MMM D, YYYY')}</span>
							</span>
							<p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--pb-muted)' }}>{comment.commentContent}</p>
						</div>
					</article>
				);
			})}

			{total > LIMIT && (
				<div className="pb-pagination">
					<Pagination page={page} count={Math.ceil(total / LIMIT)} onChange={(e, value) => setPage(value)} shape="circular" color="primary" />
				</div>
			)}
		</section>
	);
};

export default Reviews;
