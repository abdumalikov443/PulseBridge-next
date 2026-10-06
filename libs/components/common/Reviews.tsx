import React, { useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { Pagination } from '@mui/material';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_COMMENTS } from '../../../apollo/user/query';
import { CREATE_COMMENT, UPDATE_COMMENT } from '../../../apollo/user/mutation';
import { CommentGroup, CommentStatus } from '../../enums/comment.enum';
import { Comment } from '../../types/comment/comment';
import { T } from '../../types/common';
import { COMMENT_CONTENT_MAX, getMemberName, Messages } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';
import Avatar from '../ui/Avatar';
import { EcgLine } from '../ui/Loaders';

interface ReviewsProps {
	refId: string;
	group: CommentGroup;
	// the doctor or clinic owner cannot review themselves
	ownerMemberId?: string;
	onPosted?: () => void;
	// active comment count: the stored counter is not lowered when a comment is deleted
	onTotal?: (total: number) => void;
	title?: string;
}

const LIMIT = 5;

const Reviews = ({ refId, group, ownerMemberId, onPosted, onTotal, title = 'Reviews' }: ReviewsProps) => {
	const user = useReactiveVar(userVar);
	const [page, setPage] = useState(1);
	const [text, setText] = useState('');
	const [comments, setComments] = useState<Comment[]>([]);
	const [total, setTotal] = useState(0);
	const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);

	/** APOLLO REQUESTS **/
	const [createComment, { loading: posting }] = useMutation(CREATE_COMMENT);
	const [updateComment] = useMutation(UPDATE_COMMENT);
	const { refetch } = useQuery(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		skip: !refId,
		variables: { input: { page, limit: LIMIT, sort: 'createdAt', direction: 'DESC', search: { commentRefId: refId } } },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => applyComments(data),
	});

	function applyComments(data: T) {
		const count = data?.getComments?.metaCounter?.[0]?.total ?? 0;
		setComments(data?.getComments?.list ?? []);
		setTotal(count);
		onTotal && onTotal(count);
	}

	/** HANDLERS **/
	const isOwner = !!ownerMemberId && ownerMemberId === user?._id;

	const submitHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			if (!text.trim()) return;
			await createComment({ variables: { input: { commentGroup: group, commentRefId: refId, commentContent: text.trim() } } });
			setText('');
			setPage(1);
			applyComments((await refetch()).data);
			onPosted && onPosted();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	// authors edit or delete their own comments
	const saveEdit = async () => {
		try {
			if (!editing || !editing.text.trim()) return;
			await updateComment({ variables: { input: { _id: editing.id, commentContent: editing.text.trim() } } });
			setEditing(null);
			applyComments((await refetch()).data);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const deleteComment = async (id: string) => {
		try {
			if (!(await sweetConfirmAlert('Delete this comment?'))) return;
			await updateComment({ variables: { input: { _id: id, commentStatus: CommentStatus.DELETE } } });
			applyComments((await refetch()).data);
			onPosted && onPosted();
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<section className="pb-card pb-card--flat" style={{ gap: 16 }}>
			<div className="pb-section-head" style={{ marginBottom: 0 }}>
				<h2 className="pb-title" style={{ fontSize: 22 }}>
					{title}
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
						{title === 'Reviews' ? 'Leave a review' : 'Write a comment'}
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

			{comments.length === 0 && <p style={{ margin: 0, color: 'var(--pb-muted)' }}>Nothing here yet.</p>}
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
							{editing?.id === comment._id ? (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
									<textarea
										className="pb-textarea"
										rows={2}
										maxLength={COMMENT_CONTENT_MAX}
										value={editing.text}
										aria-label="Edit comment"
										onChange={(e) => setEditing({ id: comment._id, text: e.target.value })}
									/>
									<div style={{ display: 'flex', gap: 6 }}>
										<button type="button" className="pb-btn pb-btn--primary pb-btn--sm" onClick={saveEdit}>
											Save
										</button>
										<button type="button" className="pb-btn pb-btn--light pb-btn--sm" onClick={() => setEditing(null)}>
											Cancel
										</button>
									</div>
								</div>
							) : (
								<p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--pb-muted)' }}>{comment.commentContent}</p>
							)}
							{comment.memberId === user?._id && editing?.id !== comment._id && (
								<span style={{ display: 'flex', gap: 12, fontSize: 13 }}>
									<button type="button" className="pb-link" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer' }} onClick={() => setEditing({ id: comment._id, text: comment.commentContent })}>
										Edit
									</button>
									<button type="button" className="pb-link" style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'var(--pb-danger)' }} onClick={() => deleteComment(comment._id)}>
										Delete
									</button>
								</span>
							)}
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
