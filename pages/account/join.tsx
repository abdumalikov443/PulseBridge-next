import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { withPbLayout } from '../../libs/components/layout/PbShell';
import Icon from '../../libs/components/ui/Icon';
import { EcgLine } from '../../libs/components/ui/Loaders';
import { useApolloClient } from '@apollo/client';
import ImagePicker from '../../libs/components/ui/ImagePicker';
import ScheduleFields from '../../libs/components/common/ScheduleFields';
import { DEFAULT_SCHEDULE, scheduleError, withScheduleDefaults } from '../../libs/schedule';
import { getJwtToken, logIn, signUp } from '../../libs/auth';
import { saveMemberImage } from '../../libs/memberPhoto';
import { uploadImage } from '../../libs/upload';
import { UPDATE_CLINIC } from '../../apollo/user/mutation';
import { GET_MY_CLINIC } from '../../apollo/user/query';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { MemberType } from '../../libs/enums/member.enum';
import { DoctorSpecialty } from '../../libs/enums/doctor.enum';
import { ClinicType } from '../../libs/enums/clinic.enum';
import { MemberInput } from '../../libs/types/member/member.input';
import { DoctorProfileInput } from '../../libs/types/doctor/doctor.input';
import { ClinicInput } from '../../libs/types/clinic/clinic.input';
import { formatEnum } from '../../libs/utils';

export const getStaticProps = async ({ locale }: any) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

const roles = [
	{ type: MemberType.PATIENT, text: 'Find doctors and book visits' },
	{ type: MemberType.DOCTOR, text: 'Join a clinic and see patients' },
	{ type: MemberType.CLINIC, text: 'Manage your clinic and doctors' },
];

const Join: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [loginView, setLoginView] = useState(true);
	const [busy, setBusy] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	// DOCTOR: profile photo, CLINIC: clinic photo; uploaded right after the account exists
	const [photo, setPhoto] = useState<File | null>(null);
	const apollo = useApolloClient();
	const [input, setInput] = useState({ nick: '', password: '', phone: '', type: MemberType.PATIENT as MemberType });
	// DOCTOR and CLINIC send their profile in the same signup
	const [doctorProfile, setDoctorProfile] = useState<DoctorProfileInput>({
		specialty: DoctorSpecialty.GENERAL,
		experience: 0,
	});
	const [clinicProfile, setClinicProfile] = useState<ClinicInput>({
		clinicType: ClinicType.PRIVATE,
		clinicName: '',
		clinicAddress: '',
		clinicDesc: '',
		...DEFAULT_SCHEDULE,
	});

	/** HANDLERS **/
	// what still blocks the signup, shown under the button (same limits as the backend)
	const missing: string[] = [];
	if (input.nick.length < 3) missing.push(t('nickname (3–12 characters)'));
	if (input.password.length < 5) missing.push(t('password (5–12 characters)'));
	if (!input.phone) missing.push(t('phone'));
	if (input.type === MemberType.CLINIC) {
		if (clinicProfile.clinicName.trim().length < 3) missing.push(t('clinic name (min 3 characters)'));
		if (clinicProfile.clinicAddress.trim().length < 3) missing.push(t('address (min 3 characters)'));
		if (clinicProfile.clinicDesc.trim().length < 5)
			missing.push(t('description ({{count}}/5 characters)', { count: clinicProfile.clinicDesc.trim().length }));
		if (scheduleError(withScheduleDefaults(clinicProfile))) missing.push(t('working hours'));
	}
	const signupInvalid = missing.length > 0;

	// upload needs a login, so the photo is saved after signup; a failure here keeps the new account
	const savePhoto = async (file: File, type: MemberType) => {
		try {
			if (type === MemberType.DOCTOR) {
				await saveMemberImage(apollo, await uploadImage(file, 'member'));
			} else if (type === MemberType.CLINIC) {
				const clinicImage = await uploadImage(file, 'clinic');
				const { data } = await apollo.query({ query: GET_MY_CLINIC, fetchPolicy: 'network-only' });
				const clinicId = data?.getMyClinic?._id;
				if (clinicId)
					await apollo.mutate({ mutation: UPDATE_CLINIC, variables: { input: { _id: clinicId, clinicImage } } });
				// the clinic photo is also the account avatar
				await saveMemberImage(apollo, clinicImage);
			}
		} catch (err: any) {
			await sweetMixinErrorAlert('Your account is ready, but the photo was not saved. You can add it on My Page.');
		}
	};

	const submitHandler = async () => {
		try {
			setBusy(true);
			if (loginView) {
				await logIn(input.nick, input.password);
			} else {
				const memberInput: MemberInput = {
					memberNick: input.nick,
					memberPassword: input.password,
					memberPhone: input.phone,
					memberType: input.type,
					...(input.type === MemberType.DOCTOR && { doctorProfile }),
					...(input.type === MemberType.CLINIC && { clinicProfile }),
				};
				await signUp(memberInput);
				if (photo && getJwtToken()) await savePhoto(photo, input.type);
			}
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="pb-container" style={{ paddingTop: 40 }}>
			<div className="pb-auth">
				<form
					className="pb-card pb-card--flat pb-in pb-auth__form"
					onSubmit={(e) => {
						e.preventDefault();
						submitHandler();
					}}
				>
					<div className="pb-pills" role="tablist" aria-label={t('Account')}>
						<button
							type="button"
							role="tab"
							aria-selected={loginView}
							className={`pb-pill ${loginView ? 'pb-pill--active' : ''}`}
							onClick={() => setLoginView(true)}
						>
							{t('Log in')}
						</button>
						<button
							type="button"
							role="tab"
							aria-selected={!loginView}
							className={`pb-pill ${!loginView ? 'pb-pill--active' : ''}`}
							onClick={() => setLoginView(false)}
						>
							{t('Sign up')}
						</button>
					</div>

					<div>
						<h1 className="pb-title" style={{ fontSize: 30 }}>
							{loginView ? t('Welcome back') : t('Create your account')}
						</h1>
						<p style={{ margin: '6px 0 0', color: 'var(--pb-muted)' }}>
							{loginView
								? t('Log in with your nickname and password.')
								: t('One account per role. You cannot change the role later.')}
						</p>
					</div>

					{!loginView && (
						<fieldset
							style={{
								border: 0,
								padding: 0,
								margin: 0,
								display: 'grid',
								gap: 8,
								gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
							}}
						>
							<legend className="pb-sr">{t('Role')}</legend>
							{roles.map((role) => (
								<button
									key={role.type}
									type="button"
									aria-pressed={input.type === role.type}
									onClick={() => {
										if (role.type !== input.type) setPhoto(null);
										setInput({ ...input, type: role.type });
									}}
									className="pb-auth__role"
									data-active={input.type === role.type}
								>
									<strong>{formatEnum(role.type)}</strong>
									<span>{t(role.text)}</span>
								</button>
							))}
						</fieldset>
					)}

					<div className="pb-form-grid">
						<label className="pb-field">
							<span>{t('Nickname')}</span>
							<input
								className="pb-input"
								autoComplete="username"
								minLength={3}
								maxLength={12}
								value={input.nick}
								onChange={(e) => setInput({ ...input, nick: e.target.value })}
							/>
						</label>
						<label className="pb-field">
							<span>{t('Password')}</span>
							<div className="pb-password">
								<input
									className="pb-input"
									type={showPassword ? 'text' : 'password'}
									autoComplete={loginView ? 'current-password' : 'new-password'}
									minLength={5}
									maxLength={12}
									value={input.password}
									onChange={(e) => setInput({ ...input, password: e.target.value })}
								/>
								<button
									type="button"
									className="pb-password__toggle"
									aria-label={showPassword ? t('Hide password') : t('Show password')}
									aria-pressed={showPassword}
									onClick={() => setShowPassword(!showPassword)}
								>
									<Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
								</button>
							</div>
						</label>
						{!loginView && (
							<label className="pb-field">
								<span>{t('Phone')}</span>
								<input
									className="pb-input"
									type="tel"
									autoComplete="tel"
									value={input.phone}
									onChange={(e) => setInput({ ...input, phone: e.target.value })}
								/>
							</label>
						)}
					</div>

					{!loginView && input.type === MemberType.DOCTOR && (
						<ImagePicker
							file={photo}
							onChange={setPhoto}
							label="Profile photo"
							hint="Patients see it on your profile. JPG or PNG, up to 5 MB"
						/>
					)}

					{!loginView && input.type === MemberType.DOCTOR && (
						<div className="pb-form-grid">
							<label className="pb-field">
								<span>{t('Specialty')}</span>
								<select
									className="pb-select"
									value={doctorProfile.specialty}
									onChange={(e) => setDoctorProfile({ ...doctorProfile, specialty: e.target.value as DoctorSpecialty })}
								>
									{Object.values(DoctorSpecialty).map((specialty) => (
										<option key={specialty} value={specialty}>
											{formatEnum(specialty)}
										</option>
									))}
								</select>
							</label>
							<label className="pb-field">
								<span>{t('Experience (years)')}</span>
								<input
									className="pb-input"
									type="number"
									min={0}
									max={80}
									placeholder="0"
									value={doctorProfile.experience || ''}
									onChange={(e) =>
										setDoctorProfile({
											...doctorProfile,
											experience: Math.min(80, Math.max(0, parseInt(e.target.value, 10) || 0)),
										})
									}
								/>
							</label>
						</div>
					)}

					{!loginView && input.type === MemberType.CLINIC && (
						<>
							<ImagePicker
								file={photo}
								onChange={setPhoto}
								label="Clinic photo"
								hint="Shown on your clinic card. JPG or PNG, up to 5 MB"
								shape="wide"
							/>
							<div className="pb-form-grid">
								<label className="pb-field">
									<span>{t('Clinic name')}</span>
									<input
										className="pb-input"
										maxLength={100}
										value={clinicProfile.clinicName}
										onChange={(e) => setClinicProfile({ ...clinicProfile, clinicName: e.target.value })}
									/>
								</label>
								<label className="pb-field">
									<span>{t('Clinic type')}</span>
									<select
										className="pb-select"
										value={clinicProfile.clinicType}
										onChange={(e) => setClinicProfile({ ...clinicProfile, clinicType: e.target.value as ClinicType })}
									>
										{Object.values(ClinicType).map((type) => (
											<option key={type} value={type}>
												{formatEnum(type)}
											</option>
										))}
									</select>
								</label>
								<label className="pb-field">
									<span>{t('Address')}</span>
									<input
										className="pb-input"
										maxLength={100}
										value={clinicProfile.clinicAddress}
										onChange={(e) => setClinicProfile({ ...clinicProfile, clinicAddress: e.target.value })}
									/>
								</label>
							</div>
							<label className="pb-field">
								<span>{t('Description (min 5 characters)')}</span>
								<textarea
									className="pb-textarea"
									rows={3}
									maxLength={500}
									value={clinicProfile.clinicDesc}
									onChange={(e) => setClinicProfile({ ...clinicProfile, clinicDesc: e.target.value })}
								/>
							</label>
							<ScheduleFields
								value={withScheduleDefaults(clinicProfile)}
								onChange={(schedule) => setClinicProfile({ ...clinicProfile, ...schedule })}
							/>
						</>
					)}

					<button
						type="submit"
						className="pb-btn pb-btn--primary pb-btn--lg pb-btn--block"
						disabled={busy || (loginView ? !input.nick || !input.password : signupInvalid)}
					>
						{busy ? <EcgLine small /> : loginView ? t('Log in') : t('Create account')}
						{!busy && <Icon name="arrow" className="pb-arrow" />}
					</button>
					{!loginView && signupInvalid && (
						<p className="pb-auth__missing" aria-live="polite">
							{t('To continue, fill in:')} {missing.join(', ')}.
						</p>
					)}
				</form>

				<aside className="pb-auth__visual" aria-hidden="true">
					<div className="pb-hero__blob pb-hero__blob--a" />
					<div className="pb-hero__blob pb-hero__blob--b" />
					<div
						className="pb-card pb-card--flat"
						style={{
							position: 'relative',
							alignItems: 'center',
							textAlign: 'center',
							padding: 32,
							boxShadow: 'var(--pb-shadow)',
						}}
					>
						<EcgLine />
						<strong style={{ fontFamily: 'var(--pb-font-display)', fontSize: 24 }}>{t('Care, one bridge away')}</strong>
						<span style={{ color: 'var(--pb-muted)' }}>{t('Clinics, doctors and your visits in one place.')}</span>
					</div>
				</aside>
			</div>
		</div>
	);
};

export default withPbLayout(Join);
