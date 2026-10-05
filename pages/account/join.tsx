import React, { useCallback, useState } from 'react';
import { NextPage } from 'next';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { Box, Button, Checkbox, FormControlLabel, FormGroup, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { logIn, signUp } from '../../libs/auth';
import { sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
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

const Join: NextPage = () => {
	const router = useRouter();
	const device = useDeviceDetect();
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
	});
	const [loginView, setLoginView] = useState<boolean>(true);

	/** HANDLERS **/
	const viewChangeHandler = (state: boolean) => {
		setLoginView(state);
	};

	const checkUserTypeHandler = (e: any) => {
		const checked = e.target.checked;
		if (checked) {
			const value = e.target.name;
			handleInput('type', value);
		} else {
			handleInput('type', MemberType.PATIENT);
		}
	};

	const isSignupDisabled = () => {
		if (input.nick == '' || input.password == '' || input.phone == '') return true;
		if (input.type === MemberType.CLINIC) {
			return (
				clinicProfile.clinicName.trim().length < 3 ||
				clinicProfile.clinicAddress.trim().length < 3 ||
				clinicProfile.clinicDesc.trim().length < 5
			);
		}
		return false;
	};

	const handleInput = useCallback((name: any, value: any) => {
		setInput((prev) => {
			return { ...prev, [name]: value };
		});
	}, []);

	const doLogin = useCallback(async () => {
		try {
			await logIn(input.nick, input.password);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	}, [input]);

	const doSignUp = useCallback(async () => {
		try {
			const memberInput: MemberInput = {
				memberNick: input.nick,
				memberPassword: input.password,
				memberPhone: input.phone,
				memberType: input.type,
				...(input.type === MemberType.DOCTOR && { doctorProfile }),
				...(input.type === MemberType.CLINIC && { clinicProfile }),
			};
			await signUp(memberInput);
			await router.push(`${router.query.referrer ?? '/'}`);
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	}, [input, doctorProfile, clinicProfile]);

	if (device === 'mobile') {
		return <div>LOGIN MOBILE</div>;
	} else {
		return (
			<Stack className={'join-page'}>
				<Stack className={'container'}>
					<Stack className={'main'}>
						<Stack className={'left'}>
							{/* @ts-ignore */}
							<Box className={'logo'}>
								<img src="/img/logo/logoText.svg" alt="" />
								<span>PulseBridge</span>
							</Box>
							<Box className={'info'}>
								<span>{loginView ? 'login' : 'signup'}</span>
								<p>{loginView ? 'Login' : 'Sign'} in with this account across the following sites.</p>
							</Box>
							<Box className={'input-wrap'}>
								<div className={'input-box'}>
									<span>Nickname</span>
									<input
										type="text"
										placeholder={'Enter Nickname'}
										onChange={(e) => handleInput('nick', e.target.value)}
										required={true}
										onKeyDown={(event) => {
											if (event.key == 'Enter' && loginView) doLogin();
											if (event.key == 'Enter' && !loginView) doSignUp();
										}}
									/>
								</div>
								<div className={'input-box'}>
									<span>Password</span>
									<input
										type="password"
										placeholder={'Enter Password'}
										onChange={(e) => handleInput('password', e.target.value)}
										required={true}
										onKeyDown={(event) => {
											if (event.key == 'Enter' && loginView) doLogin();
											if (event.key == 'Enter' && !loginView) doSignUp();
										}}
									/>
								</div>
								{!loginView && (
									<div className={'input-box'}>
										<span>Phone</span>
										<input
											type="text"
											placeholder={'Enter Phone'}
											onChange={(e) => handleInput('phone', e.target.value)}
											required={true}
											onKeyDown={(event) => {
												if (event.key == 'Enter') doSignUp();
											}}
										/>
									</div>
								)}
							</Box>
							<Box className={'register'}>
								{!loginView && (
									<div className={'type-option'}>
										<span className={'text'}>I want to be registered as:</span>
										<div>
											{[MemberType.PATIENT, MemberType.DOCTOR, MemberType.CLINIC].map((type: MemberType) => (
												<FormGroup key={type}>
													<FormControlLabel
														control={
															<Checkbox
																size="small"
																name={type}
																onChange={checkUserTypeHandler}
																checked={input?.type == type}
															/>
														}
														label={formatEnum(type)}
													/>
												</FormGroup>
											))}
										</div>
									</div>
								)}
								{!loginView && input.type === MemberType.DOCTOR && (
									<Box className={'input-wrap'}>
										<div className={'input-box'}>
											<span>Specialty</span>
											<select
												value={doctorProfile.specialty}
												onChange={(e) =>
													setDoctorProfile({ ...doctorProfile, specialty: e.target.value as DoctorSpecialty })
												}
											>
												{Object.values(DoctorSpecialty).map((specialty: DoctorSpecialty) => (
													<option key={specialty} value={specialty}>
														{formatEnum(specialty)}
													</option>
												))}
											</select>
										</div>
										<div className={'input-box'}>
											<span>Experience (years)</span>
											<input
												type="number"
												min={0}
												value={doctorProfile.experience}
												onChange={(e) =>
													setDoctorProfile({
														...doctorProfile,
														experience: Math.max(0, parseInt(e.target.value || '0', 10)),
													})
												}
											/>
										</div>
									</Box>
								)}
								{!loginView && input.type === MemberType.CLINIC && (
									<Box className={'input-wrap'}>
										<div className={'input-box'}>
											<span>Clinic name</span>
											<input
												type="text"
												maxLength={100}
												placeholder={'Enter clinic name'}
												value={clinicProfile.clinicName}
												onChange={(e) => setClinicProfile({ ...clinicProfile, clinicName: e.target.value })}
											/>
										</div>
										<div className={'input-box'}>
											<span>Clinic type</span>
											<select
												value={clinicProfile.clinicType}
												onChange={(e) =>
													setClinicProfile({ ...clinicProfile, clinicType: e.target.value as ClinicType })
												}
											>
												{Object.values(ClinicType).map((type: ClinicType) => (
													<option key={type} value={type}>
														{formatEnum(type)}
													</option>
												))}
											</select>
										</div>
										<div className={'input-box'}>
											<span>Address</span>
											<input
												type="text"
												maxLength={100}
												placeholder={'Enter clinic address'}
												value={clinicProfile.clinicAddress}
												onChange={(e) => setClinicProfile({ ...clinicProfile, clinicAddress: e.target.value })}
											/>
										</div>
										<div className={'input-box'}>
											<span>Description</span>
											<input
												type="text"
												maxLength={500}
												placeholder={'Describe your clinic (min 5 characters)'}
												value={clinicProfile.clinicDesc}
												onChange={(e) => setClinicProfile({ ...clinicProfile, clinicDesc: e.target.value })}
											/>
										</div>
									</Box>
								)}

								{loginView && (
									<div className={'remember-info'}>
										<FormGroup>
											<FormControlLabel control={<Checkbox defaultChecked size="small" />} label="Remember me" />
										</FormGroup>
										<a>Lost your password?</a>
									</div>
								)}

								{loginView ? (
									<Button
										variant="contained"
										endIcon={<img src="/img/icons/rightup.svg" alt="" />}
										disabled={input.nick == '' || input.password == ''}
										onClick={doLogin}
									>
										LOGIN
									</Button>
								) : (
									<Button
										variant="contained"
										disabled={isSignupDisabled()}
										onClick={doSignUp}
										endIcon={<img src="/img/icons/rightup.svg" alt="" />}
									>
										SIGNUP
									</Button>
								)}
							</Box>
							<Box className={'ask-info'}>
								{loginView ? (
									<p>
										Not registered yet?
										<b
											onClick={() => {
												viewChangeHandler(false);
											}}
										>
											SIGNUP
										</b>
									</p>
								) : (
									<p>
										Have account?
										<b onClick={() => viewChangeHandler(true)}> LOGIN</b>
									</p>
								)}
							</Box>
						</Stack>
						<Stack className={'right'}></Stack>
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default withLayoutBasic(Join);
