import React, { useMemo, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import Avatar from '../../libs/components/ui/Avatar';
import Icon from '../../libs/components/ui/Icon';
import { EcgLine } from '../../libs/components/ui/Loaders';
import { userVar } from '../../apollo/store';
import { GET_DOCTOR } from '../../apollo/user/query';
import { CREATE_APPOINTMENT } from '../../apollo/user/mutation';
import { Doctor } from '../../libs/types/doctor/doctor';
import { MemberType } from '../../libs/enums/member.enum';
import { T } from '../../libs/types/common';
import { getMemberName } from '../../libs/config';
import { formatEnum } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

// appointment slots are Seoul wall-clock times (the backend checks them in Asia/Seoul)
const TIME_ZONE = 'Asia/Seoul';
const SLOTS = Array.from({ length: 18 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const STEPS = ['Date & time', 'Reason', 'Confirm'];

const seoulNow = () => {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(new Date());
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
	return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
};

const nextDays = (count: number) => {
	const start = new Date(`${seoulNow().date}T00:00:00Z`);
	return Array.from({ length: count }, (_, i) => {
		const day = new Date(start.getTime() + i * 86400000);
		return {
			value: day.toISOString().slice(0, 10),
			weekday: day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
			label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
		};
	});
};

const Booking: NextPage = () => {
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const doctorId = router.query.doctorId as string | undefined;
	const days = useMemo(() => nextDays(14), []);
	const [doctor, setDoctor] = useState<Doctor | null>(null);
	const [step, setStep] = useState(0);
	const [date, setDate] = useState(days[0].value);
	const [time, setTime] = useState('');
	const [reason, setReason] = useState('');
	const [error, setError] = useState('');
	const [done, setDone] = useState(false);

	/** APOLLO REQUESTS **/
	const [createAppointment, { loading: booking }] = useMutation(CREATE_APPOINTMENT);
	useQuery(GET_DOCTOR, {
		skip: !doctorId,
		variables: { input: doctorId },
		onCompleted: (data: T) => setDoctor(data?.getDoctor ?? null),
	});

	/** HANDLERS **/
	const now = seoulNow();
	const isPast = (slot: string) => date < now.date || (date === now.date && slot <= now.time);
	const reasonText = reason.trim();
	const reasonOk = !reasonText || reasonText.length >= 3;

	const confirmHandler = async () => {
		try {
			setError('');
			await createAppointment({
				variables: { input: { doctorId, appointmentDate: date, appointmentTime: time, ...(reasonText && { appointmentReason: reasonText }) } },
			});
			setDone(true);
		} catch (err: any) {
			const message: string = err?.graphQLErrors?.[0]?.message ?? err.message;
			setError(message);
			// a taken slot sends the patient back to choose another time
			if (/already booked|future/i.test(message)) {
				setTime('');
				setStep(0);
			}
		}
	};

	if (!doctorId) {
		return (
			<div className="pb-container" style={{ padding: '48px 0' }}>
				<p className="pb-empty">
					Choose a doctor first. <Link href="/doctor" className="pb-link">Find a doctor</Link>
				</p>
			</div>
		);
	}

	const name = getMemberName(doctor?.memberData);
	const dayLabel = days.find((d) => d.value === date);
	const blocked = !user?._id ? 'login' : user.memberType !== MemberType.PATIENT ? 'role' : null;

	return (
		<div className="pb-container">
			<div style={{ padding: '24px 0 8px' }}>
				<Link href={`/doctor/detail?id=${doctorId}`} className="pb-link" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
					<Icon name="arrowLeft" size={16} /> Back to {name || 'doctor'}
				</Link>
			</div>
			<header className="pb-page-head" style={{ paddingTop: 8 }}>
				<h1 className="pb-title">Book an appointment</h1>
			</header>

			<ol className="pb-pills" aria-label="Steps" style={{ listStyle: 'none', margin: '12px 0 24px', padding: 0 }}>
				{STEPS.map((label, i) => (
					<li key={label} className={`pb-pill ${step === i && !done ? 'pb-pill--active' : ''}`} aria-current={step === i ? 'step' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
						<span style={{ width: 22, height: 22, borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: step > i || done ? 'var(--pb-success-soft)' : 'rgba(255,255,255,.25)', color: step > i || done ? 'var(--pb-success)' : 'inherit' }}>
							{step > i || done ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}
						</span>
						{label}
					</li>
				))}
			</ol>

			<div className="pb-split">
				<aside className="pb-split__side" style={{ order: 2 }}>
					<section className="pb-card pb-card--flat">
						<span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
							<Avatar name={name} image={doctor?.memberData?.memberImage} size={60} />
							<span style={{ display: 'flex', flexDirection: 'column' }}>
								<strong style={{ fontSize: 17 }}>{name || '…'}</strong>
								<span style={{ fontSize: 13, color: 'var(--pb-deep)', fontWeight: 700 }}>
									{formatEnum(doctor?.specialty)} · {doctor?.experience ?? 0} yrs
								</span>
								<span style={{ fontSize: 13, color: 'var(--pb-muted)' }}>{doctor?.clinicData?.clinicName}</span>
							</span>
						</span>
						<dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12, paddingTop: 14, borderTop: '1px solid var(--pb-line)' }}>
							<div>
								<dt style={{ fontSize: 12, fontWeight: 700, color: 'var(--pb-muted)' }}>Date</dt>
								<dd style={{ margin: '2px 0 0', fontWeight: 800 }}>{dayLabel ? `${dayLabel.weekday}, ${dayLabel.label}` : '—'}</dd>
							</div>
							<div>
								<dt style={{ fontSize: 12, fontWeight: 700, color: 'var(--pb-muted)' }}>Time</dt>
								<dd style={{ margin: '2px 0 0', fontWeight: 800 }}>{time || '—'}</dd>
							</div>
						</dl>
						<p style={{ margin: 0, fontSize: 13, color: 'var(--pb-muted)', lineHeight: 1.5 }}>Times are Seoul time. You can cancel a confirmed visit from My Page.</p>
					</section>
				</aside>

				<section className="pb-split__main pb-card pb-card--flat" style={{ gap: 22 }}>
					{blocked && (
						<p className="pb-badge pb-badge--warning" style={{ borderRadius: 14, padding: '12px 14px', fontSize: 14 }}>
							{blocked === 'login' ? (
								<>
									Log in as a patient to book. <Link href="/account/join" className="pb-link">Log in</Link>
								</>
							) : (
								'Only patient accounts can book appointments.'
							)}
						</p>
					)}
					{error && (
						<p role="alert" className="pb-badge pb-badge--danger" style={{ borderRadius: 14, padding: '12px 14px', fontSize: 14 }}>
							{error}
						</p>
					)}

					{done ? (
						<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0', textAlign: 'center' }} className="pb-in">
							<span className="pb-avatar" style={{ width: 64, height: 64, background: 'var(--pb-success-soft)', color: 'var(--pb-success)' }}>
								<Icon name="check" size={30} strokeWidth={2.6} />
							</span>
							<h2 className="pb-title" style={{ fontSize: 26 }}>
								Appointment confirmed
							</h2>
							<p style={{ margin: 0, color: 'var(--pb-muted)' }}>
								{dayLabel?.weekday}, {dayLabel?.label} at {time} with {name}. The doctor has been notified.
							</p>
							<Link href="/mypage?category=myAppointments" className="pb-btn pb-btn--primary">
								Go to my appointments
							</Link>
						</div>
					) : (
						<>
							{step === 0 && (
								<>
									<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
										<h2 style={{ margin: 0, fontSize: 18 }}>Choose a day</h2>
										<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))', gap: 8 }}>
											{days.map((day) => (
												<button
													key={day.value}
													type="button"
													aria-pressed={date === day.value}
													className={`pb-pill ${date === day.value ? 'pb-pill--active' : ''}`}
													onClick={() => {
														setDate(day.value);
														setTime('');
													}}
													style={{ minHeight: 64, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: date === day.value ? undefined : 'inset 0 0 0 1px #c9dce8' }}
												>
													<span style={{ fontSize: 12, opacity: 0.8 }}>{day.weekday}</span>
													<span style={{ fontSize: 15 }}>{day.label}</span>
												</button>
											))}
										</div>
									</div>
									<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
										<h2 style={{ margin: 0, fontSize: 18 }}>Choose a time</h2>
										<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8 }}>
											{SLOTS.map((slot) => (
												<button
													key={slot}
													type="button"
													disabled={isPast(slot)}
													aria-pressed={time === slot}
													className={`pb-pill ${time === slot ? 'pb-pill--active' : ''}`}
													onClick={() => setTime(slot)}
													style={{ borderRadius: 12, opacity: isPast(slot) ? 0.4 : 1, boxShadow: time === slot ? undefined : 'inset 0 0 0 1px #c9dce8' }}
												>
													{slot}
												</button>
											))}
										</div>
									</div>
								</>
							)}

							{step === 1 && (
								<label className="pb-field">
									<span>
										Reason for visit <span style={{ color: 'var(--pb-muted)', fontWeight: 500 }}>(optional, 3–500 characters)</span>
									</span>
									<textarea className="pb-textarea" rows={5} maxLength={500} value={reason} placeholder="e.g. Annual check-up and blood pressure follow-up" onChange={(e) => setReason(e.target.value)} />
								</label>
							)}

							{step === 2 && (
								<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, padding: 18, borderRadius: 16, background: 'var(--pb-bg)' }}>
									{[
										['Doctor', name],
										['Clinic', doctor?.clinicData?.clinicName ?? '—'],
										['Date', `${dayLabel?.weekday}, ${dayLabel?.label}`],
										['Time', time],
										['Reason', reasonText || '—'],
									].map(([label, value]) => (
										<div key={label}>
											<span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pb-muted)' }}>{label}</span>
											<div style={{ fontWeight: 800 }}>{value}</div>
										</div>
									))}
								</div>
							)}

							<div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, paddingTop: 18, borderTop: '1px solid var(--pb-line)' }}>
								<button type="button" className="pb-btn pb-btn--light" disabled={step === 0} onClick={() => setStep(step - 1)} style={{ boxShadow: 'inset 0 0 0 1px #c9dce8' }}>
									Back
								</button>
								{step < 2 ? (
									<button type="button" className="pb-btn pb-btn--primary" disabled={(step === 0 && !time) || (step === 1 && !reasonOk)} onClick={() => setStep(step + 1)}>
										Continue <Icon name="arrow" className="pb-arrow" />
									</button>
								) : (
									<button type="button" className="pb-btn pb-btn--primary" disabled={!!blocked || booking} onClick={confirmHandler} aria-busy={booking}>
										{booking ? (
											<>
												<EcgLine small /> Booking…
											</>
										) : (
											'Confirm booking'
										)}
									</button>
								)}
							</div>
						</>
					)}
				</section>
			</div>
		</div>
	);
};

export default withPbLayout(Booking);
