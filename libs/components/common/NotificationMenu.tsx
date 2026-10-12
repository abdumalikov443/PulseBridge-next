import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { tr } from '../../i18n';
import { usePublicTargets } from '../../hooks/usePublicTargets';
import { MemberType } from '../../enums/member.enum';
import { getMemberName } from '../../config';
import { useRouter } from 'next/router';
import { Drawer } from '@mui/material';
import Moment from 'react-moment';
import { useMutation, useQuery } from '@apollo/client';
import { GET_NOTIFICATIONS } from '../../../apollo/user/query';
import { READ_ALL_NOTIFICATIONS, READ_NOTIFICATION } from '../../../apollo/user/mutation';
import { Notification } from '../../types/notification/notification';
import { NotificationGroup, NotificationStatus, NotificationType } from '../../enums/notification.enum';
import { T } from '../../types/common';
import Icon, { IconName } from '../ui/Icon';

// the backend has no push for notifications, so the list is polled
const POLL_INTERVAL = 30000;
const LIMIT = 20;

const icons: Record<NotificationType, { icon: IconName; tone: string }> = {
	[NotificationType.LIKE]: { icon: 'heart', tone: 'pink' },
	[NotificationType.COMMENT]: { icon: 'comment', tone: 'blue' },
	[NotificationType.FOLLOW]: { icon: 'userPlus', tone: 'green' },
	[NotificationType.APPOINTMENT]: { icon: 'calendar', tone: 'orange' },
	[NotificationType.DOCTOR_REQUEST]: { icon: 'clinic', tone: 'violet' },
};

// where a notification came from; doctor and clinic likes/comments have no ref id, so they open the owner's page
// the API writes notification texts in English; known sentences are shown in the current language
const DESC_PATTERNS: [RegExp, string, string[]][] = [
	[/^Your article (.+) got a new like$/, 'Your article {{title}} got a new like', ['title']],
	[/^Your clinic (.+) got a new like$/, 'Your clinic {{name}} got a new like', ['name']],
	[/^A doctor wants to join (.+)$/, 'A doctor wants to join {{name}}', ['name']],
	[/^(.+) approved your request$/, '{{name}} approved your request', ['name']],
	[/^(.+) rejected your request$/, '{{name}} rejected your request', ['name']],
];
const noteText = (text: string): string => {
	for (const [pattern, key, names] of DESC_PATTERNS) {
		const match = text.match(pattern);
		if (match) return tr(key, Object.fromEntries(names.map((name, i) => [name, match[i + 1]])));
	}
	return tr(text);
};

// where a notification leads: the article, the liked / commented doctor profile or clinic (notificationRefId),
// the appointment, or the join requests; the author's own member page is never the target
const sourceOf = (item: Notification): { href: string; label: string } => {
	if (item.articleId) return { href: `/community/detail?id=${item.articleId}`, label: 'Open article' };
	switch (item.notificationType) {
		case NotificationType.APPOINTMENT:
			return item.appointmentId
				? { href: `/appointment?id=${item.appointmentId}`, label: 'Open appointment' }
				: { href: '/mypage?category=myAppointments', label: 'My appointments' };
		case NotificationType.DOCTOR_REQUEST:
			return { href: '/mypage?category=joinRequests', label: 'Join requests' };
		// someone followed my doctor profile / clinic
		case NotificationType.FOLLOW:
			return { href: '/mypage?category=followers', label: 'Your followers' };
	}
	if (item.notificationRefId && item.notificationGroup === NotificationGroup.DOCTOR)
		return { href: `/doctor/detail?id=${item.notificationRefId}`, label: 'Your doctor profile' };
	if (item.notificationRefId && item.notificationGroup === NotificationGroup.CLINIC)
		return { href: `/clinic/detail?id=${item.notificationRefId}`, label: 'Your clinic' };
	if (item.notificationGroup === NotificationGroup.CLINIC)
		return { href: '/mypage?category=myClinic', label: 'My clinic' };
	return { href: '/mypage', label: 'My Page' };
};

const NotificationMenu = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [onlyUnread, setOnlyUnread] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState<number>(0);
	// doctors and clinics are named by their public profile (loaded when the drawer opens)
	const { clinics } = usePublicTargets(!open);
	const authorName = (item: Notification): string => {
		const member = item.authorData;
		if (!member) return '';
		if (member.memberType === MemberType.CLINIC) {
			const clinic = clinics.find((ele) => ele.memberId === member._id);
			if (clinic) return clinic.clinicName;
		}
		return getMemberName(member);
	};

	/** APOLLO REQUESTS **/
	const [readNotification] = useMutation(READ_NOTIFICATION);
	const [readAllNotifications] = useMutation(READ_ALL_NOTIFICATIONS);

	const { refetch: notificationsRefetch } = useQuery(GET_NOTIFICATIONS, {
		fetchPolicy: 'network-only',
		variables: {
			input: { page: 1, limit: LIMIT, search: onlyUnread ? { notificationStatus: NotificationStatus.WAIT } : {} },
		},
		pollInterval: POLL_INTERVAL,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => setNotifications(data?.getNotifications?.list ?? []),
	});

	const { refetch: unreadRefetch } = useQuery(GET_NOTIFICATIONS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 1, search: { notificationStatus: NotificationStatus.WAIT } } },
		pollInterval: POLL_INTERVAL,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => setUnreadCount(data?.getNotifications?.metaCounter?.[0]?.total ?? 0),
	});

	/** HANDLERS **/
	const refreshAll = async () => {
		await Promise.all([notificationsRefetch(), unreadRefetch()]);
	};

	const openHandler = async (item: Notification) => {
		try {
			if (item.notificationStatus === NotificationStatus.WAIT) {
				await readNotification({ variables: { input: item._id } });
				refreshAll().then();
			}
		} catch (err: any) {
			console.log('ERROR, openHandler:', err.message);
		}
		setOpen(false);
		await router.push(sourceOf(item).href);
	};

	const readAllHandler = async () => {
		try {
			await readAllNotifications();
			await refreshAll();
		} catch (err: any) {
			console.log('ERROR, readAllHandler:', err.message);
		}
	};

	return (
		<>
			<button
				type="button"
				className="pb-icon-btn pb-bell"
				aria-label={unreadCount ? t('Notifications, {{count}} unread', { count: unreadCount }) : t('Notifications')}
				onClick={() => {
					setOpen(true);
					refreshAll().then();
				}}
			>
				<Icon name="bell" size={20} />
				{unreadCount > 0 && <span className="pb-bell__count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
			</button>

			<Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ className: 'pb-drawer' }}>
				<div className="pb-drawer__head">
					<h2>{t('Notifications')}</h2>
					<button
						type="button"
						className="pb-btn pb-btn--light pb-btn--sm"
						disabled={unreadCount === 0}
						onClick={readAllHandler}
					>
						{t('Mark all read')}
					</button>
					<button type="button" className="pb-drawer__close" aria-label={t('Close')} onClick={() => setOpen(false)}>
						<Icon name="close" size={18} />
					</button>
				</div>
				<div className="pb-drawer__tabs" role="tablist" aria-label={t('Filter')}>
					<button
						type="button"
						role="tab"
						aria-selected={!onlyUnread}
						className={`pb-pill ${!onlyUnread ? 'pb-pill--active' : ''}`}
						onClick={() => setOnlyUnread(false)}
					>
						{t('All')}
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={onlyUnread}
						className={`pb-pill ${onlyUnread ? 'pb-pill--active' : ''}`}
						onClick={() => setOnlyUnread(true)}
					>
						{t('Unread')} · {unreadCount}
					</button>
				</div>
				<div className="pb-drawer__list">
					{notifications.length === 0 && (
						<p className="pb-drawer__empty">
							{onlyUnread ? t('You have read everything.') : t('No notifications yet.')}
						</p>
					)}
					{notifications.map((item) => {
						const look = icons[item.notificationType] ?? icons[NotificationType.LIKE];
						const source = sourceOf(item);
						const unread = item.notificationStatus === NotificationStatus.WAIT;
						return (
							<button
								key={item._id}
								type="button"
								className={`pb-note-item ${unread ? 'is-unread' : ''}`}
								onClick={() => openHandler(item)}
							>
								<span className={`pb-note-item__icon pb-tone--${look.tone}`}>
									<Icon name={look.icon} size={18} />
								</span>
								<span className="pb-note-item__body">
									<strong>{noteText(item.notificationTitle)}</strong>
									{item.notificationDesc && (
										<span className="pb-note-item__desc">{noteText(item.notificationDesc)}</span>
									)}
									<span className="pb-note-item__src">
										<Icon name="arrow" size={12} />
										{t(source.label)}
										{authorName(item) && <em> · {t('by {{name}}', { name: authorName(item) })}</em>}
									</span>
								</span>
								<span className="pb-note-item__time">
									<Moment fromNow>{item.createdAt}</Moment>
								</span>
							</button>
						);
					})}
				</div>
			</Drawer>
		</>
	);
};

export default NotificationMenu;
