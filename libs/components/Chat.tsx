import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { chatMessagesVar, chatNewVar, chatOnlineVar, socketVar, userVar } from '../../apollo/store';
import { Member } from '../types/member/member';
import { MemberType } from '../enums/member.enum';
import { getMemberName } from '../config';
import { formatEnum } from '../utils';
import Avatar from './ui/Avatar';
import Icon from './ui/Icon';
import AiAssistant from './chat/AiAssistant';

interface MessagePayload {
	event: string;
	text: string;
	memberData: Member;
}

type ChatTab = 'community' | 'ai';

const MESSAGE_MAX = 200;
const HINT_KEY = 'pb_chat_hint_closed';

// floating chat: live community chat (WebSocket, the server keeps the last 5 messages) and the AI assistant
const Chat = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const socket = useReactiveVar(socketVar);
	const inputRef = useRef<HTMLInputElement>(null);
	const endRef = useRef<HTMLDivElement>(null);
	const socketMessages: MessagePayload[] = useReactiveVar(chatMessagesVar);
	const socketOnline = useReactiveVar(chatOnlineVar);
	const newCount = useReactiveVar(chatNewVar);
	// socket data can arrive before hydration; the server HTML has none, so it is shown after mount
	const [mounted, setMounted] = useState(false);
	const messagesList = mounted ? socketMessages : [];
	const onlineUsers = mounted ? socketOnline : 0;
	const [messageInput, setMessageInput] = useState<string>('');
	const [open, setOpen] = useState(false);
	const [tab, setTab] = useState<ChatTab>('community');
	const [hint, setHint] = useState(false);
	// messages that came in while the chat was closed
	const [seen, setSeen] = useState(0);
	const unread = open ? 0 : Math.max(0, newCount - seen);

	/** LIFECYCLES **/

	useEffect(() => {
		setMounted(true);
		try {
			setHint(!localStorage.getItem(HINT_KEY));
		} catch {
			setHint(true);
		}
	}, []);

	useEffect(() => {
		setOpen(false);
	}, [router.pathname]);

	useEffect(() => {
		if (open) {
			setSeen(newCount);
			if (tab === 'community') inputRef.current?.focus();
		}
	}, [open, newCount, tab]);

	// keep the newest message in view
	useEffect(() => {
		if (open && tab === 'community') endRef.current?.scrollIntoView({ block: 'end' });
	}, [messagesList.length, open, tab]);

	/** HANDLERS **/
	const closeHint = () => {
		setHint(false);
		try {
			localStorage.setItem(HINT_KEY, '1');
		} catch {}
	};

	const openChat = (next: ChatTab) => {
		setTab(next);
		setOpen(true);
		closeHint();
	};

	const sendHandler = () => {
		const text = messageInput.trim();
		if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;
		socket.send(JSON.stringify({ event: 'message', data: text }));
		setMessageInput('');
	};

	return (
		<div className="pb-chat">
			{mounted && hint && !open && (
				<div className="pb-chat__hint" role="note">
					<button type="button" className="pb-chat__hint-text" onClick={() => openChat('ai')}>
						<strong>{t('Not sure which doctor you need?')}</strong>
						<span>{t('Describe your symptoms to the AI assistant')}</span>
					</button>
					<button type="button" className="pb-chat__hint-close" aria-label={t('Hide this tip')} onClick={closeHint}>
						<Icon name="close" size={14} />
					</button>
				</div>
			)}

			<button
				type="button"
				className={`pb-chat__launcher ${open ? 'is-open' : ''}`}
				aria-label={open ? t('Close chat') : t('Open chat')}
				aria-expanded={open}
				onClick={() => (open ? setOpen(false) : openChat(tab))}
			>
				<Icon name={open ? 'close' : 'chat'} size={24} />
				{!open && unread > 0 && <span className="pb-chat__unread">{unread > 9 ? '9+' : unread}</span>}
			</button>

			<section className={`pb-chat__panel ${open ? 'is-open' : ''}`} aria-label={t('Chat')} aria-hidden={!open}>
				<header className="pb-chat__head">
					<span className="pb-chat__mark">
						<Icon name={tab === 'ai' ? 'pulse' : 'chat'} size={20} />
					</span>
					<div style={{ flex: 1, minWidth: 0 }}>
						<strong>{tab === 'ai' ? t('AI assistant') : t('Live chat')}</strong>
						{tab === 'ai' ? (
							<span className="pb-chat__online">{t('Finds the right type of doctor')}</span>
						) : (
							<span className="pb-chat__online">
								<i aria-hidden="true" />
								{t('{{count}} online', { count: onlineUsers })}
							</span>
						)}
					</div>
					<button type="button" className="pb-chat__close" aria-label={t('Close chat')} onClick={() => setOpen(false)}>
						<Icon name="close" size={18} />
					</button>
				</header>

				<div className="pb-chat__tabs" role="tablist" aria-label={t('Chat type')}>
					<button
						type="button"
						role="tab"
						aria-selected={tab === 'community'}
						className={tab === 'community' ? 'is-active' : ''}
						onClick={() => setTab('community')}
					>
						<Icon name="users" size={15} /> {t('Community')}
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={tab === 'ai'}
						className={tab === 'ai' ? 'is-active' : ''}
						onClick={() => setTab('ai')}
					>
						<Icon name="pulse" size={15} /> {t('AI assistant')}
					</button>
				</div>

				{tab === 'ai' ? (
					<AiAssistant active={open && tab === 'ai'} />
				) : (
					<>
						<div className="pb-chat__body">
							<div className="pb-chat__scroll">
								<div className="pb-chat__list">
									<p className="pb-chat__note">
										{t(
											'Ask the community about clinics, doctors and healthy habits. Please do not share private medical data.',
										)}
									</p>
									{messagesList.length === 0 && <p className="pb-chat__empty">{t('No messages yet. Say hello!')}</p>}
									{messagesList.map((ele: MessagePayload, index: number) => {
										const { text, memberData } = ele;
										const mine = !!user?._id && memberData?._id === user._id;
										const prev = messagesList[index - 1];
										const grouped = !!prev && (prev.memberData?._id ?? 'guest') === (memberData?._id ?? 'guest');
										const name = getMemberName(memberData) || t('Guest');
										const role =
											memberData?.memberType && memberData.memberType !== MemberType.PATIENT
												? formatEnum(memberData.memberType)
												: '';

										return (
											<div
												key={index}
												className={`pb-msg ${mine ? 'pb-msg--mine' : ''} ${grouped ? 'pb-msg--grouped' : ''}`}
											>
												{!mine && (
													<span className="pb-msg__avatar">
														{!grouped && <Avatar name={name} image={memberData?.memberImage} size={32} />}
													</span>
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
									<div ref={endRef} />
								</div>
							</div>
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
								aria-label={t('Message')}
								placeholder={user?._id ? t('Write a message…') : t('Write as guest…')}
								maxLength={MESSAGE_MAX}
								value={messageInput}
								onChange={(e) => setMessageInput(e.target.value)}
							/>
							<button type="submit" className="pb-chat__send" aria-label={t('Send')} disabled={!messageInput.trim()}>
								<Icon name="send" size={18} />
							</button>
						</form>
					</>
				)}
			</section>
		</div>
	);
};

export default Chat;
