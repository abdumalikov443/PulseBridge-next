import React, { useState } from 'react';
import { Badge, Button, Divider, Menu, MenuItem, Stack, Typography } from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import Moment from 'react-moment';
import { useMutation, useQuery } from '@apollo/client';
import { GET_NOTIFICATIONS } from '../../../apollo/user/query';
import { READ_ALL_NOTIFICATIONS, READ_NOTIFICATION } from '../../../apollo/user/mutation';
import { Notification } from '../../types/notification/notification';
import { NotificationStatus } from '../../enums/notification.enum';
import { T } from '../../types/common';

// the backend has no push for notifications, so the list is polled
const POLL_INTERVAL = 30000;

const NotificationMenu = () => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [readNotification] = useMutation(READ_NOTIFICATION);
	const [readAllNotifications] = useMutation(READ_ALL_NOTIFICATIONS);

	const { refetch: notificationsRefetch } = useQuery(GET_NOTIFICATIONS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 10, search: {} } },
		pollInterval: POLL_INTERVAL,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => setNotifications(data?.getNotifications?.list ?? []),
	});

	const { refetch: unreadRefetch } = useQuery(GET_NOTIFICATIONS, {
		fetchPolicy: 'network-only',
		variables: { input: { page: 1, limit: 1, search: { notificationStatus: NotificationStatus.WAIT } } },
		pollInterval: POLL_INTERVAL,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => setUnreadCount(data?.getNotifications?.metaCounter[0]?.total ?? 0),
	});

	/** HANDLERS **/

	const refreshAll = async () => {
		await notificationsRefetch();
		await unreadRefetch();
	};

	const readHandler = async (notification: Notification) => {
		try {
			if (notification.notificationStatus === NotificationStatus.WAIT) {
				await readNotification({ variables: { input: notification._id } });
				await refreshAll();
			}
		} catch (err: any) {
			console.log('ERROR, readHandler:', err.message);
		}
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
			<Badge badgeContent={unreadCount} color={'error'} max={99} sx={{ cursor: 'pointer' }}>
				<NotificationsOutlinedIcon
					className={'notification-icon'}
					onClick={(e: any) => {
						setAnchorEl(e.currentTarget);
						refreshAll().then();
					}}
				/>
			</Badge>
			<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} sx={{ mt: '8px' }}>
				<Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} sx={{ px: 2, py: 1, width: 340 }}>
					<Typography fontWeight={600}>Notifications</Typography>
					<Button size={'small'} disabled={unreadCount === 0} onClick={readAllHandler}>
						Read all
					</Button>
				</Stack>
				<Divider />
				{notifications.length === 0 && (
					<MenuItem disabled>
						<Typography variant={'body2'}>No notifications yet</Typography>
					</MenuItem>
				)}
				{notifications.map((notification: Notification) => (
					<MenuItem
						key={notification._id}
						onClick={() => readHandler(notification)}
						sx={{ whiteSpace: 'normal', opacity: notification.notificationStatus === NotificationStatus.READ ? 0.6 : 1 }}
					>
						<div style={{ width: 300 }}>
							<Typography variant={'body2'} fontWeight={600}>
								{notification.notificationTitle}
							</Typography>
							{notification.notificationDesc && (
								<Typography variant={'body2'}>{notification.notificationDesc}</Typography>
							)}
							<Typography variant={'caption'} color={'text.secondary'}>
								{notification.authorData?.memberNick} · <Moment fromNow>{notification.createdAt}</Moment>
							</Typography>
						</div>
					</MenuItem>
				))}
			</Menu>
		</>
	);
};

export default NotificationMenu;
