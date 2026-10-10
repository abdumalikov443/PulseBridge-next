import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import moment from 'moment';
import { useMutation, useQuery } from '@apollo/client';
import {
	Box,
	Dialog,
	Divider,
	List,
	ListItem,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
} from '@mui/material';
import { GET_ALL_NOTICES_BY_ADMIN } from '../../../../apollo/admin/query';
import { CREATE_NOTICE, REMOVE_NOTICE, UPDATE_NOTICE } from '../../../../apollo/admin/mutation';
import { FaqTopic, NoticeCategory, NoticeStatus } from '../../../enums/notice.enum';
import { Notice } from '../../../types/notice/notice';
import { AllNoticesInquiry, NoticeInput } from '../../../types/notice/notice.input';
import { NoticeUpdate } from '../../../types/notice/notice.update';
import { T } from '../../../types/common';
import { Direction } from '../../../enums/common.enum';
import { getMemberName } from '../../../config';
import { formatEnum } from '../../../utils';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { sweetConfirmAlert, sweetErrorHandling, sweetTopSmallSuccessAlert } from '../../../sweetAlert';
import Icon from '../../ui/Icon';
import AdminTotal from '../AdminTotal';
import CopyId from '../CopyId';

const TITLE_MIN = 3;
const TITLE_MAX = 100;
const CONTENT_MIN = 3;
const CONTENT_MAX = 2000;

type StatusTab = 'ALL' | NoticeStatus;
const STATUS_TABS: { value: StatusTab; label: string }[] = [
	{ value: 'ALL', label: 'All' },
	{ value: NoticeStatus.ACTIVE, label: 'Published' },
	{ value: NoticeStatus.HOLD, label: 'Drafts' },
	{ value: NoticeStatus.DELETE, label: 'Deleted' },
];
const STATUS_LABEL: Record<NoticeStatus, string> = {
	[NoticeStatus.ACTIVE]: 'Published',
	[NoticeStatus.HOLD]: 'Draft',
	[NoticeStatus.DELETE]: 'Deleted',
};

interface Draft {
	_id?: string;
	faqTopic: FaqTopic;
	noticeTitle: string;
	noticeContent: string;
	noticeStatus: NoticeStatus.HOLD | NoticeStatus.ACTIVE;
	noticePinned: boolean;
}

const emptyDraft = (): Draft => ({
	faqTopic: FaqTopic.ACCOUNT,
	noticeTitle: '',
	noticeContent: '',
	noticeStatus: NoticeStatus.ACTIVE,
	noticePinned: false,
});

// admin list of FAQ answers or notices: create, edit, publish / draft, pin, delete (then remove for good)
const NoticeManager = ({ category }: { category: NoticeCategory }) => {
	const { t } = useTranslation('common');
	const isFaq = category === NoticeCategory.FAQ;
	const [inquiry, setInquiry] = useState<AllNoticesInquiry>({
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: Direction.DESC,
		search: { noticeCategory: category },
	});
	const [notices, setNotices] = useState<Notice[] | null>(null);
	const [total, setTotal] = useState(0);
	const [tab, setTab] = useState<StatusTab>('ALL');
	const [text, setText] = useState('');
	const [draft, setDraft] = useState<Draft | null>(null);

	/** APOLLO REQUESTS **/
	const [createNotice, { loading: creating }] = useMutation(CREATE_NOTICE);
	const [updateNotice, { loading: updating }] = useMutation(UPDATE_NOTICE);
	const [removeNotice] = useMutation(REMOVE_NOTICE);
	const { refetch } = useQuery(GET_ALL_NOTICES_BY_ADMIN, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setNotices(data?.getAllNoticesByAdmin?.list ?? []);
			setTotal(data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? 0);
		},
		onError: () => setNotices([]),
	});

	// live title search
	const debouncedText = useDebouncedValue(text, 400);
	useEffect(() => {
		const search = { ...inquiry.search, text: debouncedText.trim() || undefined };
		if (search.text === inquiry.search.text) return;
		setInquiry({ ...inquiry, page: 1, search });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedText]);

	/** HANDLERS **/
	const reload = async () => {
		const res = await refetch({ input: inquiry });
		setNotices(res.data?.getAllNoticesByAdmin?.list ?? []);
		setTotal(res.data?.getAllNoticesByAdmin?.metaCounter?.[0]?.total ?? 0);
	};

	const changeTab = (value: StatusTab) => {
		setTab(value);
		const search = { ...inquiry.search, noticeStatus: value === 'ALL' ? undefined : value };
		setInquiry({ ...inquiry, page: 1, search });
	};

	const changeTopic = (value: string) => {
		setInquiry({
			...inquiry,
			page: 1,
			search: { ...inquiry.search, faqTopic: (value || undefined) as FaqTopic | undefined },
		});
	};

	const update = async (input: NoticeUpdate, done?: string) => {
		try {
			await updateNotice({ variables: { input } });
			await reload();
			if (done) await sweetTopSmallSuccessAlert(done, 800);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	// DELETE first hides it; a deleted one can then be removed for good
	const deleteHandler = async (notice: Notice) => {
		try {
			if (notice.noticeStatus !== NoticeStatus.DELETE) {
				if (await sweetConfirmAlert('Move it to deleted? Users will not see it.'))
					await update({ _id: notice._id, noticeStatus: NoticeStatus.DELETE }, 'Deleted');
				return;
			}
			if (!(await sweetConfirmAlert('Remove it for good? This cannot be undone.'))) return;
			await removeNotice({ variables: { input: notice._id } });
			await reload();
			await sweetTopSmallSuccessAlert('Removed', 800);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const openEdit = (notice: Notice) =>
		setDraft({
			_id: notice._id,
			faqTopic: notice.faqTopic ?? FaqTopic.OTHER,
			noticeTitle: notice.noticeTitle,
			noticeContent: notice.noticeContent,
			noticeStatus: notice.noticeStatus === NoticeStatus.HOLD ? NoticeStatus.HOLD : NoticeStatus.ACTIVE,
			noticePinned: notice.noticePinned,
		});

	// same limits as the backend NoticeInput
	const problems: string[] = [];
	if (draft) {
		const title = draft.noticeTitle.trim().length;
		const content = draft.noticeContent.trim().length;
		if (title < TITLE_MIN) problems.push(t('title: at least {{count}} characters', { count: TITLE_MIN }));
		if (content < CONTENT_MIN) problems.push(t('text: at least {{count}} characters', { count: CONTENT_MIN }));
	}

	const saveHandler = async () => {
		if (!draft || problems.length) return;
		try {
			const base = {
				noticeTitle: draft.noticeTitle.trim(),
				noticeContent: draft.noticeContent.trim(),
				noticePinned: draft.noticePinned,
				...(isFaq && { faqTopic: draft.faqTopic }),
			};
			if (draft._id) {
				await updateNotice({
					variables: { input: { _id: draft._id, ...base, noticeStatus: draft.noticeStatus } as NoticeUpdate },
				});
			} else {
				const input: NoticeInput = { noticeCategory: category, ...base, noticeStatus: draft.noticeStatus };
				await createNotice({ variables: { input } });
			}
			setDraft(null);
			await reload();
			await sweetTopSmallSuccessAlert('Saved', 800);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	const colSpan = isFaq ? 7 : 6;

	return (
		<Box component={'div'} className={'content'}>
			<div className="pb-notice-admin__head">
				<Typography variant={'h2'} className={'tit'}>
					{isFaq ? t('FAQ Management') : t('Notice Management')}
					<AdminTotal total={total} noun={isFaq ? 'question' : 'notice'} />
				</Typography>
				<button type="button" className="pb-btn pb-btn--primary" onClick={() => setDraft(emptyDraft())}>
					<Icon name="plus" size={16} />
					{isFaq ? t('New question') : t('New notice')}
				</button>
			</div>

			<Box component={'div'} className={'table-wrap'}>
				<List className={'tab-menu'}>
					{STATUS_TABS.map((item) => (
						<ListItem
							key={item.value}
							onClick={() => changeTab(item.value)}
							className={tab === item.value ? 'li on' : 'li'}
						>
							{t(item.label)}
						</ListItem>
					))}
				</List>
				<Divider />
				<div className="pb-notice-admin__filters">
					<label className="pb-search" style={{ flex: '1 1 260px' }}>
						<Icon name="search" />
						<span className="pb-sr">{t('Search by title')}</span>
						<input value={text} placeholder={t('Search by title')} onChange={(e) => setText(e.target.value)} />
					</label>
					{isFaq && (
						<select
							className="pb-select"
							style={{ flex: '0 1 220px' }}
							value={inquiry.search.faqTopic ?? ''}
							onChange={(e) => changeTopic(e.target.value)}
							aria-label={t('Topic')}
						>
							<option value="">{t('All topics')}</option>
							{Object.values(FaqTopic).map((topic) => (
								<option key={topic} value={topic}>
									{formatEnum(topic)}
								</option>
							))}
						</select>
					)}
				</div>
				<Divider />

				<TableContainer>
					<Table sx={{ minWidth: 760 }}>
						<TableHead>
							<TableRow>
								<TableCell align="left">{t('TITLE')}</TableCell>
								{isFaq && <TableCell align="center">{t('TOPIC')}</TableCell>}
								<TableCell align="center">{t('STATUS')}</TableCell>
								<TableCell align="center">{t('WRITER')}</TableCell>
								<TableCell align="center">{t('UPDATED')}</TableCell>
								<TableCell align="left">{t('ID')}</TableCell>
								<TableCell align="right">{t('ACTION')}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{notices?.length === 0 && (
								<TableRow>
									<TableCell align="center" colSpan={colSpan}>
										<span className={'no-data'}>{t('No data found')}</span>
									</TableCell>
								</TableRow>
							)}
							{notices?.map((notice) => (
								<TableRow hover key={notice._id}>
									<TableCell align="left" className="pb-notice-admin__title">
										<strong>
											{notice.noticePinned && <Icon name="pin" size={14} />}
											{notice.noticeTitle}
										</strong>
										<span>{notice.noticeContent}</span>
									</TableCell>
									{isFaq && <TableCell align="center">{notice.faqTopic ? formatEnum(notice.faqTopic) : '—'}</TableCell>}
									<TableCell align="center">
										<span className={`pb-admin-status pb-admin-status--${notice.noticeStatus.toLowerCase()}`}>
											{t(STATUS_LABEL[notice.noticeStatus])}
										</span>
									</TableCell>
									<TableCell align="center">{getMemberName(notice.memberData) || '—'}</TableCell>
									<TableCell align="center">{moment(notice.updatedAt).format('YYYY-MM-DD')}</TableCell>
									<TableCell align="left">
										<CopyId id={notice._id} />
									</TableCell>
									<TableCell align="right">
										<span className="pb-notice-admin__actions">
											{notice.noticeStatus !== NoticeStatus.DELETE && (
												<>
													<button
														type="button"
														className={`pb-icon-action ${notice.noticePinned ? 'is-on' : ''}`}
														aria-pressed={notice.noticePinned}
														aria-label={notice.noticePinned ? t('Unpin') : t('Pin to top')}
														title={notice.noticePinned ? t('Unpin') : t('Pin to top')}
														onClick={() => update({ _id: notice._id, noticePinned: !notice.noticePinned })}
													>
														<Icon name="pin" size={16} />
													</button>
													<button
														type="button"
														className="pb-icon-action"
														aria-label={
															notice.noticeStatus === NoticeStatus.ACTIVE ? t('Move to drafts') : t('Publish')
														}
														title={notice.noticeStatus === NoticeStatus.ACTIVE ? t('Move to drafts') : t('Publish')}
														onClick={() =>
															update({
																_id: notice._id,
																noticeStatus:
																	notice.noticeStatus === NoticeStatus.ACTIVE ? NoticeStatus.HOLD : NoticeStatus.ACTIVE,
															})
														}
													>
														<Icon name={notice.noticeStatus === NoticeStatus.ACTIVE ? 'eyeOff' : 'eye'} size={16} />
													</button>
													<button
														type="button"
														className="pb-icon-action"
														aria-label={t('Edit')}
														title={t('Edit')}
														onClick={() => openEdit(notice)}
													>
														<Icon name="edit" size={16} />
													</button>
												</>
											)}
											{notice.noticeStatus === NoticeStatus.DELETE && (
												<button
													type="button"
													className="pb-icon-action"
													aria-label={t('Restore as draft')}
													title={t('Restore as draft')}
													onClick={() => update({ _id: notice._id, noticeStatus: NoticeStatus.HOLD }, 'Restored')}
												>
													<Icon name="refresh" size={16} />
												</button>
											)}
											<button
												type="button"
												className="pb-icon-action pb-icon-action--danger"
												aria-label={notice.noticeStatus === NoticeStatus.DELETE ? t('Remove for good') : t('Delete')}
												title={notice.noticeStatus === NoticeStatus.DELETE ? t('Remove for good') : t('Delete')}
												onClick={() => deleteHandler(notice)}
											>
												<Icon name="trash" size={16} />
											</button>
										</span>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>

				<TablePagination
					labelRowsPerPage={t('Rows per page:')}
					labelDisplayedRows={({ from, to, count }) => t('{{from}}–{{to}} of {{count}}', { from, to, count })}
					rowsPerPageOptions={[10, 20, 40]}
					component="div"
					count={total}
					rowsPerPage={inquiry.limit}
					page={inquiry.page - 1}
					onPageChange={(e, page) => setInquiry({ ...inquiry, page: page + 1 })}
					onRowsPerPageChange={(e) => setInquiry({ ...inquiry, page: 1, limit: parseInt(e.target.value, 10) })}
				/>
			</Box>

			<Dialog
				open={!!draft}
				onClose={() => setDraft(null)}
				fullWidth
				maxWidth="sm"
				PaperProps={{ className: 'pb-notice-dialog' }}
			>
				{draft && (
					<form
						className="pb-notice-dialog__form"
						onSubmit={(e) => {
							e.preventDefault();
							saveHandler();
						}}
					>
						<div className="pb-notice-dialog__head">
							<h2>
								{draft._id
									? isFaq
										? t('Edit question')
										: t('Edit notice')
									: isFaq
									? t('New question')
									: t('New notice')}
							</h2>
							<button type="button" className="pb-drawer__close" aria-label={t('Close')} onClick={() => setDraft(null)}>
								<Icon name="close" size={18} />
							</button>
						</div>

						{isFaq && (
							<label className="pb-field">
								<span>{t('Topic')}</span>
								<select
									className="pb-select"
									value={draft.faqTopic}
									onChange={(e) => setDraft({ ...draft, faqTopic: e.target.value as FaqTopic })}
								>
									{Object.values(FaqTopic).map((topic) => (
										<option key={topic} value={topic}>
											{formatEnum(topic)}
										</option>
									))}
								</select>
							</label>
						)}
						<label className="pb-field">
							<span>{isFaq ? t('Question') : t('Title')}</span>
							<input
								className="pb-input"
								autoFocus
								maxLength={TITLE_MAX}
								value={draft.noticeTitle}
								placeholder={isFaq ? t('How do I book an appointment?') : t('Online booking is open for all clinics')}
								onChange={(e) => setDraft({ ...draft, noticeTitle: e.target.value })}
							/>
						</label>
						<label className="pb-field">
							<span>{isFaq ? t('Answer') : t('Text')}</span>
							<textarea
								className="pb-textarea"
								rows={6}
								maxLength={CONTENT_MAX}
								value={draft.noticeContent}
								onChange={(e) => setDraft({ ...draft, noticeContent: e.target.value })}
							/>
							<small className="pb-notice-dialog__count">
								{draft.noticeContent.length} / {CONTENT_MAX}
							</small>
						</label>
						<div className="pb-notice-dialog__options">
							<div className="pb-pills" role="radiogroup" aria-label={t('Status')}>
								{[NoticeStatus.ACTIVE, NoticeStatus.HOLD].map((status) => (
									<button
										key={status}
										type="button"
										role="radio"
										aria-checked={draft.noticeStatus === status}
										className={`pb-pill ${draft.noticeStatus === status ? 'pb-pill--active' : ''}`}
										onClick={() => setDraft({ ...draft, noticeStatus: status as Draft['noticeStatus'] })}
									>
										{status === NoticeStatus.ACTIVE ? t('Publish now') : t('Save as draft')}
									</button>
								))}
							</div>
							<label className="pb-schedule__check">
								<input
									type="checkbox"
									checked={draft.noticePinned}
									onChange={(e) => setDraft({ ...draft, noticePinned: e.target.checked })}
								/>
								{t('Pin to top')}
							</label>
						</div>

						<div className="pb-notice-dialog__foot">
							{problems.length > 0 && (
								<p className="pb-form-hint">
									{t('To save:')} {problems.join('; ')}.
								</p>
							)}
							<span style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
								<button type="button" className="pb-btn pb-btn--light" onClick={() => setDraft(null)}>
									{t('Cancel')}
								</button>
								<button
									type="submit"
									className="pb-btn pb-btn--primary"
									disabled={problems.length > 0 || creating || updating}
								>
									{t('Save')}
								</button>
							</span>
						</div>
					</form>
				)}
			</Dialog>
		</Box>
	);
};

export default NoticeManager;
