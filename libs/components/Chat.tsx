import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import ScrollableFeed from 'react-scrollable-feed';
import { useReactiveVar } from '@apollo/client';
import { socketVar, userVar } from '../../apollo/store';
import { Member } from '../types/member/member';
import { MemberType } from '../enums/member.enum';
import { getMemberName } from '../config';
import { formatEnum } from '../utils';
import Avatar from './ui/Avatar';
import Icon from './ui/Icon';

interface MessagePayload {
	event: string;
	text: string;
	memberData: Member;
}

interface InfoPayload {
	event: string;
	totalClients: number;
	memberData: Member;
	action: string;
}

const MESSAGE_MAX = 200;

// live community chat over the backend WebSocket (the server keeps the last 5 messages)
const Chat = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const socket = useReactiveVar(socketVar);
	const inputRef = useRef<HTMLInputElement>(null);
	const [messagesList, setMessagesList] = useState<MessagePayload[]>([]);
	const [onlineUsers, setOnlineUsers] = useState<number>(0);
	const [messageInput, setMessageInput] = useState<string>('');
	const [open, setOpen] = useState(false);
	const [unread, setUnread] = useState(0);
	const openRef = useRef(open);
	openRef.current = open;

	/** LIFECYCLES **/

	useEffect(() => {
		if (!socket) return;
		socket.onmessage = (msg) => {
			const data = JSON.parse(msg.data);
			switch (data.event) {
				case 'info':
					setOnlineUsers((data as InfoPayload).totalClients);
					break;
				case 'getMessages':
					setMessagesList(data.list ?? []);
					break;
				case 'message':
					setMessagesList((list) => [...list, data as MessagePayload]);
					if (!openRef.current) setUnread((count) => count + 1);
					break;
			}
		};
	}, [socket]);

	useEffect(() => {
		setOpen(false);
	}, [router.pathname]);

	useEffect(() => {
		if (open) {
			setUnread(0);
			inputRef.current?.focus();
		}
	}, [open]);

	/** HANDLERS **/
	const sendHandler = () => {
		const text = messageInput.trim();
		if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
		socket.send(JSON.stringify({ event: 'message', data: text }));
		setMessageInput('');
	};

	return (
		<div className="pb-chat">
			<button
				type="button"
				className={`pb-chat__launcher ${open ? 'is-open' : ''}`}
				aria-label={open ? 'Close chat' : 'Open chat'}
				aria-expanded={open}
				onClick={() => setOpen(!open)}
			>
				<Icon name={open ? 'close' : 'chat'} size={24} />
				{!open && unread > 0 && <span className="pb-chat__unread">{unread > 9 ? '9+' : unread}</span>}
			</button>

			<section className={`pb-chat__panel ${open ? 'is-open' : ''}`} aria-label="Live chat" aria-hidden={!open}>
				<header className="pb-chat__head">
					<span className="pb-chat__mark">
						<Icon name="chat" size={20} />
					</span>
					<div style={{ flex: 1, minWidth: 0 }}>
						<strong>Live chat</strong>
						<span className="pb-chat__online">
							<i aria-hidden="true" />
							{onlineUsers} online
						</span>
					</div>
					<button type="button" className="pb-chat__close" aria-label="Close chat" onClick={() => setOpen(false)}>
						<Icon name="close" size={18} />
					</button>
				</header>

				<div className="pb-chat__body">
					<ScrollableFeed>
						<div className="pb-chat__list">
							<p className="pb-chat__note">Ask the community about clinics, doctors and healthy habits. Please do not share private medical data.</p>
							{messagesList.length === 0 && <p className="pb-chat__empty">No messages yet. Say hello!</p>}
							{messagesList.map((ele: MessagePayload, index: number) => {
								const { text, memberData } = ele;
								const mine = !!user?._id && memberData?._id === user._id;
								const prev = messagesList[index - 1];
								const grouped = !!prev && (prev.memberData?._id ?? 'guest') === (memberData?._id ?? 'guest');
								const name = getMemberName(memberData) || 'Guest';
								const role = memberData?.memberType && memberData.memberType !== MemberType.PATIENT ? formatEnum(memberData.memberType) : '';

								return (
									<div key={index} className={`pb-msg ${mine ? 'pb-msg--mine' : ''} ${grouped ? 'pb-msg--grouped' : ''}`}>
										{!mine && (
											<span className="pb-msg__avatar">{!grouped && <Avatar name={name} image={memberData?.memberImage} size={32} />}</span>
										)}
										<div className="pb-msg__col">
											{!mine && !grouped && (
												<span className="pb-msg__name">
													{name}
													{role && <em>{role}</em>}
												</span>
											)}
											<p className="pb-msg__bubble">{text}</p>
										</div>
									</div>
								);
							})}
						</div>
					</ScrollableFeed>
				</div>

				<form
					className="pb-chat__form"
					onSubmit={(e) => {
						e.preventDefault();
						sendHandler();
					}}
				>
					<input
						ref={inputRef}
						type="text"
						name="message"
						aria-label="Message"
						placeholder={user?._id ? 'Write a message…' : 'Write as guest…'}
						maxLength={MESSAGE_MAX}
						value={messageInput}
						onChange={(e) => setMessageInput(e.target.value)}
					/>
					<button type="submit" className="pb-chat__send" aria-label="Send" disabled={!messageInput.trim()}>
						<Icon name="send" size={18} />
					</button>
				</form>
			</section>
		</div>
	);
};

export default Chat;
