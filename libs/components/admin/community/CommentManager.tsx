import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Typography } from '@mui/material';
import { GET_ALL_ARTICLES_BY_ADMIN, GET_ALL_CLINICS_BY_ADMIN, GET_COMMENTS } from '../../../../apollo/admin/query';
import { GET_DOCTORS } from '../../../../apollo/user/query';
import { REMOVE_COMMENT_BY_ADMIN, UPDATE_COMMENT_BY_ADMIN } from '../../../../apollo/admin/mutation';
import { CommentStatus } from '../../../enums/comment.enum';
import { ArticleStatus } from '../../../enums/article.enum';
import { Comment } from '../../../types/comment/comment';
import { T } from '../../../types/common';
import { getMemberName } from '../../../config';
import { formatEnum } from '../../../utils';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../sweetAlert';
import Avatar from '../../ui/Avatar';
import Icon, { IconName } from '../../ui/Icon';
import { SkeletonCards } from '../../ui/Loaders';
import PbPagination from '../../ui/PbPagination';

type Group = 'ARTICLE' | 'DOCTOR' | 'CLINIC';

interface Target {
	id: string;
	name: string;
	sub: string;
	comments: number;
	href: string;
}

const GROUPS: { value: Group; label: string; icon: IconName }[] = [
	{ value: 'ARTICLE', label: 'Articles', icon: 'book' },
	{ value: 'DOCTOR', label: 'Doctors', icon: 'stethoscope' },
	{ value: 'CLINIC', label: 'Clinics', icon: 'clinic' },
];

// the API has no "all comments" list for the admin, so comments are reviewed per article, doctor or clinic
const TARGET_LIMIT = 100;
const COMMENT_LIMIT = 10;

const CommentManager = () => {
	const { t } = useTranslation('common');
	const [group, setGroup] = useState<Group>('ARTICLE');
	const [filter, setFilter] = useState('');
	const [selected, setSelected] = useState<Target | null>(null);
	const [page, setPage] = useState(1);

	/** APOLLO REQUESTS **/
	const articles = useQuery(GET_ALL_ARTICLES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		skip: group !== 'ARTICLE',
		variables: {
			input: {
				page: 1,
				limit: TARGET_LIMIT,
				sort: 'createdAt',
				direction: 'DESC',
				search: { articleStatus: ArticleStatus.ACTIVE },
			},
		},
	});
	const doctors = useQuery(GET_DOCTORS, {
		fetchPolicy: 'network-only',
		skip: group !== 'DOCTOR',
		variables: { input: { page: 1, limit: TARGET_LIMIT, sort: 'createdAt', direction: 'DESC', search: {} } },
	});
	const clinics = useQuery(GET_ALL_CLINICS_BY_ADMIN, {
		fetchPolicy: 'network-only',
		skip: group !== 'CLINIC',
		variables: { input: { page: 1, limit: TARGET_LIMIT, sort: 'createdAt', direction: 'DESC', search: {} } },
	});
	const comments = useQuery(GET_COMMENTS, {
		fetchPolicy: 'network-only',
		skip: !selected,
		variables: {
			input: {
				page,
				limit: COMMENT_LIMIT,
				sort: 'createdAt',
				direction: 'DESC',
				search: { commentRefId: selected?.id },
			},
		},
		notifyOnNetworkStatusChange: true,
	});
	const [updateComment] = useMutation(UPDATE_COMMENT_BY_ADMIN);
	const [removeComment] = useMutation(REMOVE_COMMENT_BY_ADMIN);

	// targets with comments, most commented first
	const targets: Target[] | null = useMemo(() => {
		const source = group === 'ARTICLE' ? articles : group === 'DOCTOR' ? doctors : clinics;
		if (!source.data) return source.error ? [] : null;
		let list: Target[] = [];
		if (group === 'ARTICLE')
			list = (source.data.getAllArticlesByAdmin?.list ?? []).map((ele: T) => ({
				id: ele._id,
				name: ele.articleTitle,
				sub: getMemberName(ele.memberData),
				comments: ele.articleComments ?? 0,
				href: `/community/detail?id=${ele._id}`,
			}));
		if (group === 'DOCTOR')
			list = (source.data.getDoctors?.list ?? []).map((ele: T) => ({
				id: ele._id,
				name: getMemberName(ele.memberData),
				sub: `${formatEnum(ele.specialty)} · ${ele.clinicData?.clinicName ?? ''}`,
				comments: ele.doctorComments ?? 0,
				href: `/doctor/detail?id=${ele._id}`,
			}));
		if (group === 'CLINIC')
			list = (source.data.getAllClinicsByAdmin?.list ?? []).map((ele: T) => ({
				id: ele._id,
				name: ele.clinicName,
				sub: ele.clinicAddress ?? '',
				comments: ele.clinicComments ?? 0,
				href: `/clinic/detail?id=${ele._id}`,
			}));
		const text = filter.trim().toLowerCase();
		return list
			.filter((ele) => ele.comments > 0 && (!text || ele.name.toLowerCase().includes(text)))
			.sort((a, b) => b.comments - a.comments);
	}, [group, filter, articles, doctors, clinics]);

	const list: Comment[] = comments.data?.getComments?.list ?? [];
	const total: number = comments.data?.getComments?.metaCounter?.[0]?.total ?? 0;

	/** HANDLERS **/
	const changeGroup = (value: Group) => {
		setGroup(value);
		setSelected(null);
		setPage(1);
	};

	const refreshAll = async () => {
		await comments.refetch();
		const source = group === 'ARTICLE' ? articles : group === 'DOCTOR' ? doctors : clinics;
		await source.refetch();
	};

	// hidden (BLOCK) comments leave the public list and the counters; removed ones are gone for good
	const hideHandler = async (comment: Comment) => {
		try {
			if (!(await sweetConfirmAlert('Hide this comment? It disappears from the site.'))) return;
			await updateComment({ variables: { input: { _id: comment._id, commentStatus: CommentStatus.BLOCK } } });
			await refreshAll();
			await sweetTopSmallSuccessAlert('Hidden', 800);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const removeHandler = async (comment: Comment) => {
		try {
			if (!(await sweetConfirmAlert('Remove it for good? This cannot be undone.'))) return;
			await removeComment({ variables: { input: comment._id } });
			await refreshAll();
			await sweetTopSmallSuccessAlert('Removed', 800);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<div className="content">
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				{t('Comments')}
			</Typography>

			<div className="pb-comment-admin">
				<aside className="pb-comment-admin__targets">
					<div className="pb-pills" role="tablist" aria-label={t('Comment type')}>
						{GROUPS.map((item) => (
							<button
								key={item.value}
								type="button"
								role="tab"
								aria-selected={group === item.value}
								className={`pb-pill ${group === item.value ? 'pb-pill--active' : ''}`}
								onClick={() => changeGroup(item.value)}
							>
								<Icon name={item.icon} size={15} /> {t(item.label)}
							</button>
						))}
					</div>
					<label className="pb-search">
						<Icon name="search" />
						<span className="pb-sr">{t('Filter by name')}</span>
						<input value={filter} placeholder={t('Filter by name')} onChange={(e) => setFilter(e.target.value)} />
					</label>
					<div className="pb-comment-admin__list">
						{targets === null && <SkeletonCards count={3} />}
						{targets?.length === 0 && <p className="pb-empty">{t('Nothing has comments yet.')}</p>}
						{targets?.map((target) => (
							<button
								key={target.id}
								type="button"
								className={`pb-comment-admin__target ${selected?.id === target.id ? 'is-active' : ''}`}
								onClick={() => {
									setSelected(target);
									setPage(1);
								}}
							>
								<span>
									<strong>{target.name}</strong>
									<small>{target.sub}</small>
								</span>
								<span className="pb-chip pb-chip--static">
									<Icon name="comment" size={16} />
									{target.comments}
								</span>
							</button>
						))}
					</div>
				</aside>

				<section className="pb-comment-admin__panel">
					{!selected ? (
						<div className="pb-comment-admin__empty">
							<Icon name="comment" size={28} />
							<p>{t('Choose an article, doctor or clinic to review its comments.')}</p>
						</div>
					) : (
						<>
							<header className="pb-comment-admin__head">
								<div style={{ minWidth: 0 }}>
									<strong>{selected.name}</strong>
									<small>{t('{{count}} comments', { count: total })}</small>
								</div>
								<Link href={selected.href} target="_blank" className="pb-btn pb-btn--light pb-btn--sm">
									{t('Open page')} <Icon name="arrow" size={14} />
								</Link>
							</header>
							{comments.loading && !comments.data && <SkeletonCards count={2} />}
							{!comments.loading && list.length === 0 && <p className="pb-empty">{t('Nothing here yet.')}</p>}
							{list.map((comment) => {
								const author = getMemberName(comment.memberData);
								return (
									<article key={comment._id} className="pb-comment-admin__row">
										<Avatar name={author} image={comment.memberData?.memberImage} size={40} />
										<div style={{ flex: 1, minWidth: 0 }}>
											<span className="pb-comment-admin__meta">
												<b>{author}</b>
												{comment.memberData?.memberType && (
													<span className="pb-badge pb-badge--soft">{formatEnum(comment.memberData.memberType)}</span>
												)}
												<span>{moment(comment.createdAt).format('YYYY-MM-DD HH:mm')}</span>
											</span>
											<p>{comment.commentContent}</p>
										</div>
										<span className="pb-comment-actions">
											<button
												type="button"
												className="pb-icon-action"
												aria-label={t('Hide')}
												title={t('Hide')}
												onClick={() => hideHandler(comment)}
											>
												<Icon name="eyeOff" size={16} />
											</button>
											<button
												type="button"
												className="pb-icon-action pb-icon-action--danger"
												aria-label={t('Remove for good')}
												title={t('Remove for good')}
												onClick={() => removeHandler(comment)}
											>
												<Icon name="trash" size={16} />
											</button>
										</span>
									</article>
								);
							})}
							<PbPagination page={page} total={total} limit={COMMENT_LIMIT} onChange={setPage} scrollTop={false} />
						</>
					)}
				</section>
			</div>
		</div>
	);
};

export default CommentManager;
