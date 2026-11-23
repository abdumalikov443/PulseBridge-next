import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { CLAIM_INTAKE_SESSION, INTAKE_CHAT } from '../../../apollo/user/mutation';
import { GET_INTAKE_RECOMMENDATIONS, GET_INTAKE_SESSION } from '../../../apollo/user/query';
import { MemberType } from '../../enums/member.enum';
import { IntakeUrgency } from '../../enums/intake.enum';
import { DoctorSpecialty } from '../../enums/doctor.enum';
import { Doctor } from '../../types/doctor/doctor';
import { getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import { sweetActionConfirmAlert } from '../../sweetAlert';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { EcgLine } from '../ui/Loaders';

interface Turn {
	role: 'user' | 'assistant' | 'error';
	content: string;
}

interface Outcome {
	ready: boolean;
	specialty?: DoctorSpecialty | null;
	urgency: IntakeUrgency;
	complaintSummary: string;
}

const MESSAGE_MAX = 1000;
// the conversation survives page changes and reloads in this browser
const STORE_KEY = 'pb_ai_intake';
const CLAIMED_KEY = 'pb_ai_claimed';

const read = (): { sessionKey: string; turns: Turn[]; outcome: Outcome | null } | null => {
	try {
		return JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null');
	} catch {
		return null;
	}
};
const write = (value: { sessionKey: string; turns: Turn[]; outcome: Outcome | null } | null) => {
	try {
		if (value) localStorage.setItem(STORE_KEY, JSON.stringify(value));
		else localStorage.removeItem(STORE_KEY);
	} catch {
		// storage blocked: the chat still works for this visit
	}
};

// the latest finished assessment of this browser's conversation (the booking page prefills its reason from it)
export const readAiOutcome = (): { specialty: DoctorSpecialty; complaintSummary: string } | null => {
	const outcome = read()?.outcome;
	return outcome?.ready && outcome.specialty && outcome.complaintSummary
		? { specialty: outcome.specialty, complaintSummary: outcome.complaintSummary }
		: null;
};

// clinics of the recommended doctors, in the doctors' order, each once
const clinicsOf = (doctors: Doctor[]) => {
	const seen = new Set<string>();
	return doctors
		.map((doctor) => doctor.clinicData)
		.filter(
			(clinic): clinic is NonNullable<Doctor['clinicData']> =>
				!!clinic && !seen.has(clinic._id) && !!seen.add(clinic._id),
		);
};

const specialtyHref = (specialty: string) =>
	`/doctor?input=${JSON.stringify({
		page: 1,
		limit: 12,
		sort: 'doctorRank',
		direction: 'DESC',
		search: { specialtyList: [specialty] },
	})}`;

interface AiAssistantProps {
	active: boolean;
}

// AI intake: the patient describes symptoms, the assistant suggests a doctor type (not a diagnosis)
const AiAssistant = ({ active }: AiAssistantProps) => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const client = useApolloClient();
	const isPatient = user?.memberType === MemberType.PATIENT;
	const [sessionKey, setSessionKey] = useState('');
	const [turns, setTurns] = useState<Turn[]>([]);
	const [outcome, setOutcome] = useState<Outcome | null>(null);
	const [text, setText] = useState('');
	const [doctors, setDoctors] = useState<Doctor[] | null>(null);
	const [loadingDoctors, setLoadingDoctors] = useState(false);
	const endRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLTextAreaElement>(null);

	/** APOLLO REQUESTS **/
	const [intakeChat, { loading: sending }] = useMutation(INTAKE_CHAT);
	const [claimSession] = useMutation(CLAIM_INTAKE_SESSION);

	/** LIFECYCLES **/
	useEffect(() => {
		const saved = read();
		if (!saved) return;
		setSessionKey(saved.sessionKey);
		setTurns(saved.turns);
		setOutcome(saved.outcome);
	}, []);

	useEffect(() => {
		if (sessionKey) write({ sessionKey, turns, outcome });
	}, [sessionKey, turns, outcome]);

	// a guest conversation becomes the patient's after login
	useEffect(() => {
		if (!isPatient || !sessionKey) return;
		let claimedFor = '';
		try {
			claimedFor = localStorage.getItem(CLAIMED_KEY) ?? '';
		} catch {}
		if (claimedFor === `${user._id}:${sessionKey}`) return;
		claimSession({ variables: { sessionKey } })
			.then(() => {
				try {
					localStorage.setItem(CLAIMED_KEY, `${user._id}:${sessionKey}`);
				} catch {}
				return client.query({ query: GET_INTAKE_SESSION, variables: { sessionKey }, fetchPolicy: 'network-only' });
			})
			.then((res) => {
				const session = res?.data?.getIntakeSession;
				if (!session) return;
				setTurns(
					session.messages.map((m: { role: string; content: string }) => ({
						role: m.role === 'user' ? 'user' : 'assistant',
						content: m.content,
					})),
				);
				setOutcome({
					ready: session.ready,
					specialty: session.specialty,
					urgency: session.urgency,
					complaintSummary: session.complaintSummary,
				});
			})
			.catch(() => {
				// expired or already another patient's: start fresh next time
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isPatient, sessionKey, user._id]);

	// matching doctors and their clinics load by themselves once a doctor type is suggested
	useEffect(() => {
		if (outcome?.ready && outcome.specialty && sessionKey && doctors === null && !loadingDoctors) loadDoctors();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [outcome?.ready, outcome?.specialty, sessionKey, doctors]);

	useEffect(() => {
		if (active) endRef.current?.scrollIntoView({ block: 'end' });
	}, [turns, outcome, doctors, active]);

	useEffect(() => {
		if (active) inputRef.current?.focus();
	}, [active]);

	/** HANDLERS **/
	const sendHandler = async () => {
		const message = text.trim();
		if (!message || sending) return;
		setText('');
		setTurns((prev) => [...prev, { role: 'user', content: message }]);
		try {
			const result = await intakeChat({ variables: { input: { message, ...(sessionKey && { sessionKey }) } } });
			const data = result.data?.intakeChat;
			if (!data) return;
			setSessionKey(data.sessionKey);
			setTurns((prev) => [...prev, { role: 'assistant', content: data.reply }]);
			setOutcome({
				ready: data.ready,
				specialty: data.specialty,
				urgency: data.urgency,
				complaintSummary: data.complaintSummary,
			});
			setDoctors(null);
		} catch (err: any) {
			const reason: string = err?.graphQLErrors?.[0]?.message ?? err?.message ?? 'Something went wrong!';
			setTurns((prev) => [...prev, { role: 'error', content: reason }]);
			// an expired conversation starts again with the next message
			if (/not found or expired/i.test(reason)) setSessionKey('');
		}
	};

	const resetHandler = () => {
		write(null);
		setSessionKey('');
		setTurns([]);
		setOutcome(null);
		setDoctors(null);
		inputRef.current?.focus();
	};

	const loadDoctors = async () => {
		try {
			setLoadingDoctors(true);
			const res = await client.query({
				query: GET_INTAKE_RECOMMENDATIONS,
				variables: { sessionKey },
				fetchPolicy: 'network-only',
			});
			setDoctors(res.data?.getIntakeRecommendations?.list ?? []);
		} catch (err: any) {
			// an empty list stops the automatic retry; the result card then offers the doctor list instead
			setDoctors([]);
			setTurns((prev) => [...prev, { role: 'error', content: err?.graphQLErrors?.[0]?.message ?? err.message }]);
		} finally {
			setLoadingDoctors(false);
		}
	};

	const callEmergency = async () => {
		if (await sweetActionConfirmAlert('Call 119 (ambulance and fire) now?', 'Call 119'))
			window.location.href = 'tel:119';
	};

	const bookHref = (doctorId: string) =>
		`/booking?doctorId=${doctorId}${
			outcome?.complaintSummary ? `&reason=${encodeURIComponent(outcome.complaintSummary.slice(0, 500))}` : ''
		}`;
	// guests log in first and come back to the same booking page, reason included
	const bookLink = (doctorId: string) =>
		user?._id ? bookHref(doctorId) : { pathname: '/account/join', query: { referrer: bookHref(doctorId) } };
	const canBook = !user?._id || isPatient;
	const shownDoctors = doctors?.slice(0, 3) ?? [];
	const shownClinics = clinicsOf(doctors ?? []).slice(0, 3);

	return (
		<>
			<div className="pb-chat__body">
				<div className="pb-chat__scroll">
					<div className="pb-chat__list">
						<p className="pb-chat__note">
							{t(
								'Describe how you feel and the assistant suggests which doctor to see. It does not diagnose. In an emergency call 119.',
							)}
						</p>
						{turns.length === 0 && (
							<div className="pb-ai__examples">
								{[
									t('I have had a headache for 3 days'),
									t('My child has a fever and a rash'),
									t('Tooth pain when I drink cold water'),
								].map((example) => (
									<button key={example} type="button" className="pb-chip" onClick={() => setText(example)}>
										{example}
									</button>
								))}
							</div>
						)}
						{turns.map((turn, index) => (
							<div
								key={index}
								className={`pb-msg ${turn.role === 'user' ? 'pb-msg--mine' : ''} ${
									turn.role === 'error' ? 'pb-msg--error' : ''
								}`}
							>
								{turn.role !== 'user' && (
									<span className="pb-msg__avatar">
										<span className="pb-ai__badge">
											<Icon name={turn.role === 'error' ? 'close' : 'pulse'} size={16} />
										</span>
									</span>
								)}
								<div className="pb-msg__col">
									<p className="pb-msg__bubble">{turn.role === 'error' ? t(turn.content) : turn.content}</p>
								</div>
							</div>
						))}
						{sending && (
							<div className="pb-msg">
								<span className="pb-msg__avatar">
									<span className="pb-ai__badge">
										<Icon name="pulse" size={16} />
									</span>
								</span>
								<div className="pb-msg__col">
									<p className="pb-msg__bubble">
										<EcgLine small width={44} />
									</p>
								</div>
							</div>
						)}

						{outcome?.urgency === IntakeUrgency.EMERGENCY && (
							<div className="pb-ai__emergency" role="alert">
								<strong>{t('This may be an emergency.')}</strong>
								<span>{t('Do not wait for an appointment.')}</span>
								<button type="button" className="pb-btn pb-btn--sm pb-ai__call" onClick={callEmergency}>
									<Icon name="phone" size={14} /> {t('Call 119')}
								</button>
							</div>
						)}

						{outcome?.ready && outcome.specialty && (
							<div className="pb-ai__result">
								<small>{t('Suggested doctor')}</small>
								<strong>{formatEnum(outcome.specialty)}</strong>
								{outcome.complaintSummary && (
									<div className="pb-ai__reason">
										<span>
											<Icon name="edit" size={13} />
											{canBook ? t('Visit reason, added to your booking') : t('Complaint summary')}
										</span>
										<p>{outcome.complaintSummary}</p>
									</div>
								)}

								{doctors === null ? (
									<span className="pb-ai__loading">
										<EcgLine small width={44} /> {t('Finding matching doctors…')}
									</span>
								) : shownDoctors.length === 0 ? (
									<Link href={specialtyHref(outcome.specialty)} className="pb-btn pb-btn--outline pb-btn--sm">
										{t('Browse {{specialty}} doctors', { specialty: formatEnum(outcome.specialty) })}
									</Link>
								) : (
									<>
										<small className="pb-ai__group">{t('Recommended doctors')}</small>
										<div className="pb-ai__doctors">
											{shownDoctors.map((doctor) => (
												<div key={doctor._id} className="pb-ai__doctor">
													<Avatar
														name={getMemberName(doctor.memberData)}
														image={doctor.memberData?.memberImage}
														size={36}
													/>
													<Link href={`/doctor/detail?id=${doctor._id}`} className="pb-ai__doctor-name">
														<strong>
															{t('Dr.')} {getMemberName(doctor.memberData)}
														</strong>
														<small>
															{doctor.clinicData?.clinicName} · {doctor.experience} {t('yrs of exp')}
														</small>
													</Link>
													{canBook && (
														<Link href={bookLink(doctor._id)} className="pb-btn pb-btn--primary pb-btn--sm">
															{t('Book')}
														</Link>
													)}
												</div>
											))}
										</div>

										{shownClinics.length > 0 && (
											<>
												<small className="pb-ai__group">{t('Where they work')}</small>
												<div className="pb-ai__doctors">
													{shownClinics.map((clinic) => (
														<Link
															key={clinic._id}
															href={`/clinic/detail?id=${clinic._id}`}
															className="pb-ai__doctor pb-ai__clinic"
														>
															<span className="pb-ai__clinic-icon">
																<Icon name="clinic" size={18} />
															</span>
															<span className="pb-ai__doctor-name">
																<strong>{clinic.clinicName}</strong>
																{clinic.clinicAddress && <small>{clinic.clinicAddress}</small>}
															</span>
															<Icon name="arrow" size={16} />
														</Link>
													))}
												</div>
											</>
										)}

										<Link href={specialtyHref(outcome.specialty)} className="pb-more pb-ai__all">
											{t('All {{specialty}} doctors', { specialty: formatEnum(outcome.specialty) })}{' '}
											<Icon name="arrow" size={14} className="pb-arrow" />
										</Link>
										{!user?._id && (
											<p className="pb-ai__hint">{t('You log in before booking; your visit reason is kept.')}</p>
										)}
									</>
								)}
							</div>
						)}
						<div ref={endRef} />
					</div>
				</div>
			</div>

			<form
				className="pb-chat__form pb-chat__form--ai"
				onSubmit={(e) => {
					e.preventDefault();
					sendHandler();
				}}
			>
				<textarea
					ref={inputRef}
					rows={1}
					aria-label={t('Describe your symptoms')}
					placeholder={t('Describe your symptoms…')}
					maxLength={MESSAGE_MAX}
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							sendHandler();
						}
					}}
				/>
				<button type="submit" className="pb-chat__send" aria-label={t('Send')} disabled={!text.trim() || sending}>
					<Icon name="send" size={18} />
				</button>
			</form>
			<div className="pb-ai__foot">
				{turns.length > 0 && (
					<button type="button" onClick={resetHandler}>
						{t('New conversation')}
					</button>
				)}
			</div>
		</>
	);
};

export default AiAssistant;
