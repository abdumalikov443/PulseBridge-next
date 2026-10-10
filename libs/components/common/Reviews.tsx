import React, { useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import moment from 'moment';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { GET_COMMENTS } from '../../../apollo/user/query';
import { CREATE_COMMENT, UPDATE_COMMENT } from '../../../apollo/user/mutation';
import { CommentGroup, CommentStatus } from '../../enums/comment.enum';
import { MemberType } from '../../enums/member.enum';
import { usePublicTargets } from '../../hooks/usePublicTargets';
import { Comment } from '../../types/comment/comment';
import { T } from '../../types/common';
import { COMMENT_CONTENT_MAX, getMemberName, Messages } from '../../config';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../sweetAlert';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { EcgLine } from '../ui/Loaders';
import PbPagination from '../ui/PbPagination';

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
	const { t } = useTranslation('common');
	const [page, setPage] = useState(1);
	const [text, setText] = useState('');
	const [comments, setComments] = useState<Comment[]>([]);
	const [total, setTotal] = useState(0);
	const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
	// the form stays folded until the button is pressed
	const [writing, setWriting] = useState(false);
	const isReview = title === 'Reviews';
	const { doctors, clinics } = usePublicTargets(comments.length === 0);

	// doctors and clinics are shown by their public profile; patients have no profile link
	const authorOf = useMemo(() => {
		const doctorByMember = new Map(doctors.map((ele) => [ele.memberId, ele]));
		const clinicByMember = new Map(clinics.map((ele) => [ele.memberId, ele]));
		return (comment: Comment): { name: string; image?: string | null; href: string | null; square?: boolean } => {
			const member = comment.memberData;
			const doctor = member?.memberType === MemberType.DOCTOR ? doctorByMember.get(member._id) : undefined;
			const clinic = member?.memberType === MemberType.CLINIC ? clinicByMember.get(member._id) : undefined;
			if (clinic)
				return {
					name: clinic.clinicName,
					image: clinic.clinicImage,
					href: `/clinic/detail?id=${clinic._id}`,
					square: true,
				};
			if (doctor)
				return {
					name: getMemberName(doctor.memberData ?? member),
					image: member?.memberImage,
					href: `/doctor/detail?id=${doctor._id}`,
				};
			return { name: getMemberName(member), image: member?.memberImage, href: null };
		};
	}, [doctors, clinics]);

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
			await createComment({
				variables: { input: { commentGroup: group, commentRefId: refId, commentContent: text.trim() } },
			});
			setText('');
			setWriting(false);
			setPage(1);
			applyComments((await refetch()).data);
			onPosted && onPosted();
			sweetTopSmallSuccessAlert(isReview ? 'Review posted' : 'Comment posted').then();
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
					{t(title)}
				</h2>
				<span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<span
						className="pb-count-chip"
						title={isReview ? t('{{count}} reviews', { count: total }) : t('{{count}} comments', { count: total })}
					>
						<Icon name="comment" size={14} />
						{total}
					</span>
					{!isOwner &&
						!writing &&
						(user?._id ? (
							<button
								type="button"
								className="pb-btn pb-btn--light pb-btn--sm pb-write-btn"
								aria-expanded={false}
								onClick={() => setWriting(true)}
							>
								<Icon name="edit" size={14} />
								{isReview ? t('Write a review') : t('Write a comment')}
							</button>
						) : (
							<Link href="/account/join" className="pb-btn pb-btn--light pb-btn--sm pb-write-btn">
								<Icon name="edit" size={14} />
								{t('Log in to write')}
							</Link>
						))}
				</span>
			</div>

			{!isOwner && user?._id && writing && (
				<form
					className="pb-in"
					onSubmit={(e) => {
						e.preventDefault();
						submitHandler();
					}}
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
						padding: 16,
						borderRadius: 16,
						background: 'var(--pb-bg)',
					}}
				>
					<label htmlFor={`review-${refId}`} style={{ fontSize: 13, fontWeight: 700 }}>
						{isReview ? t('Your review') : t('Your comment')}
					</label>
					<textarea
						id={`review-${refId}`}
						className="pb-textarea"
						rows={3}
						autoFocus
						maxLength={COMMENT_CONTENT_MAX}
						placeholder={isReview ? t('Share your experience') : t('Write your comment')}
						value={text}
						onChange={(e) => setText(e.target.value)}
					/>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
						<span style={{ fontSize: 12, color: 'var(--pb-muted)' }}>
							{text.length} / {COMMENT_CONTENT_MAX}
						</span>
						<span style={{ display: 'flex', gap: 6 }}>
							<button
								type="button"
								className="pb-btn pb-btn--light pb-btn--sm"
								onClick={() => {
									setWriting(false);
									setText('');
								}}
							>
								{t('Cancel')}
							</button>
							<button type="submit" className="pb-btn pb-btn--primary pb-btn--sm" disabled={!text.trim() || posting}>
								{posting ? <EcgLine small width={44} /> : isReview ? t('Post review') : t('Post comment')}
							</button>
						</span>
					</div>
				</form>
			)}

			{comments.length === 0 && <p style={{ margin: 0, color: 'var(--pb-muted)' }}>{t('Nothing here yet.')}</p>}
			{comments.map((comment) => {
				const author = authorOf(comment);
				return (
					<article
						key={comment._id}
						style={{ display: 'flex', gap: 12, paddingTop: 14, borderTop: '1px solid var(--pb-line)' }}
					>
						<Avatar name={author.name} image={author.image} size={40} radius={author.square ? 12 : '50%'} />
						<div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
							<span style={{ fontSize: 14 }}>
								{author.href ? (
									<Link href={author.href} style={{ fontWeight: 700 }}>
										{author.name}
									</Link>
								) : (
									<strong>{author.name}</strong>
								)}{' '}
								<span style={{ color: 'var(--pb-muted)' }}>· {moment(comment.createdAt).format('MMM D, YYYY')}</span>
							</span>
							{editing?.id === comment._id ? (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
									<textarea
										className="pb-textarea"
										rows={2}
										maxLength={COMMENT_CONTENT_MAX}
										value={editing.text}
										aria-label={t('Edit comment')}
										onChange={(e) => setEditing({ id: comment._id, text: e.target.value })}
									/>
									<div style={{ display: 'flex', gap: 6 }}>
										<button type="button" className="pb-btn pb-btn--primary pb-btn--sm" onClick={saveEdit}>
											{t('Save')}
										</button>
										<button type="button" className="pb-btn pb-btn--light pb-btn--sm" onClick={() => setEditing(null)}>
											{t('Cancel')}
										</button>
									</div>
								</div>
							) : (
								<p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--pb-muted)' }}>
									{comment.commentContent}
								</p>
							)}
							{comment.memberId === user?._id && editing?.id !== comment._id && (
								<span style={{ display: 'flex', gap: 12, fontSize: 13 }}>
									<button
										type="button"
										className="pb-link"
										style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer' }}
										onClick={() => setEditing({ id: comment._id, text: comment.commentContent })}
									>
										{t('Edit')}
									</button>
									<button
										type="button"
										className="pb-link"
										style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', color: 'var(--pb-danger)' }}
										onClick={() => deleteComment(comment._id)}
									>
										{t('Delete')}
									</button>
								</span>
							)}
						</div>
					</article>
				);
			})}

			<PbPagination page={page} total={total} limit={LIMIT} onChange={setPage} scrollTop={false} />
		</section>
	);
};

export default Reviews;
