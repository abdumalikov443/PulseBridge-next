import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { updateStorage, updateUserInfo } from '../../auth';
import { MemberUpdate } from '../../types/member/member.update';
import { MemberType } from '../../enums/member.enum';
import { UPDATE_DOCTOR, UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { GET_MY_DOCTOR_PROFILE } from '../../../apollo/user/query';
import { DoctorSpecialty } from '../../enums/doctor.enum';
import { DoctorUpdate } from '../../types/doctor/doctor.update';
import { T } from '../../types/common';
import { formatEnum } from '../../utils';
import { Messages } from '../../config';
import { uploadImage } from '../../upload';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import MySection from './MySection';
import ImagePicker from '../ui/ImagePicker';
import { EcgLine } from '../ui/Loaders';

const MyProfile = () => {
	const user = useReactiveVar(userVar);
	const [form, setForm] = useState<MemberUpdate>({ _id: '' });
	// new photo waits here until Save
	const [photo, setPhoto] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	// doctors edit their doctor profile (specialty, experience) in the same form
	const isDoctor = user.memberType === MemberType.DOCTOR;
	const [doctor, setDoctor] = useState<DoctorUpdate | null>(null);
	const [savedDoctor, setSavedDoctor] = useState<DoctorUpdate | null>(null);
	const [clinicName, setClinicName] = useState('');

	/** APOLLO REQUESTS **/
	const [updateMember, { loading: saving }] = useMutation(UPDATE_MEMBER);
	const [updateDoctor, { loading: savingDoctor }] = useMutation(UPDATE_DOCTOR);
	useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'network-only',
		skip: !isDoctor,
		onCompleted: (data: T) => {
			const value = data?.getMyDoctorProfile;
			if (!value) return;
			const profile = { _id: value._id, specialty: value.specialty, experience: value.experience };
			setDoctor(profile);
			setSavedDoctor(profile);
			setClinicName(value.clinicData?.clinicName ?? '');
		},
	});

	/** LIFECYCLES **/
	useEffect(() => {
		setForm({
			_id: user._id,
			memberNick: user.memberNick,
			memberPhone: user.memberPhone,
			memberFullName: user.memberFullName ?? '',
			memberAddress: user.memberAddress ?? '',
			memberDesc: user.memberDesc ?? '',
			// the default avatar path is not a stored image
			memberImage: user.memberImage && !user.memberImage.startsWith('/img') ? user.memberImage : '',
		});
	}, [user]);

	/** HANDLERS **/
	const saveHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			const input: MemberUpdate = { ...form, _id: user._id };
			if (photo) {
				setUploading(true);
				input.memberImage = await uploadImage(photo, 'member');
			}
			// trimmed values; an emptied optional field is sent as null so it is really cleared
			// (an empty string would fail the backend length check, a missing key would keep the old value)
			const clearable: (keyof MemberUpdate)[] = ['memberFullName', 'memberAddress', 'memberDesc'];
			(Object.keys(input) as (keyof MemberUpdate)[]).forEach((key) => {
				const value = input[key];
				if (typeof value !== 'string') return;
				const trimmed = value.trim();
				if (trimmed) (input as any)[key] = trimmed;
				else if (clearable.includes(key)) (input as any)[key] = null;
				else delete input[key];
			});
			const result = await updateMember({ variables: { input } });
			const jwtToken = result.data?.updateMember?.accessToken;
			if (jwtToken) {
				updateStorage({ jwtToken });
				updateUserInfo(jwtToken);
			}
			setPhoto(null);
			// the doctor profile is saved only when it changed
			if (doctor && (doctor.specialty !== savedDoctor?.specialty || doctor.experience !== savedDoctor?.experience)) {
				await updateDoctor({ variables: { input: doctor } });
				setSavedDoctor(doctor);
			}
			await sweetMixinSuccessAlert('Profile updated');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setUploading(false);
		}
	};

	// same limits as the backend MemberUpdate, so the save does not end in "Bad Request"
	const problems: string[] = [];
	const nick = (form.memberNick ?? '').trim();
	const fullName = (form.memberFullName ?? '').trim();
	if (nick.length < 3 || nick.length > 12) problems.push('nickname must be 3–12 characters');
	if (!(form.memberPhone ?? '').trim()) problems.push('phone is required');
	if (fullName && fullName.length < 3) problems.push('full name must be at least 3 characters (or leave it empty)');

	const field = (key: keyof MemberUpdate, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
		<label className="pb-field">
			<span>{label}</span>
			<input className="pb-input" value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
		</label>
	);

	return (
		<MySection title="Profile" subTitle="How other members see you">
			<form
				className="pb-card pb-card--flat"
				style={{ gap: 18 }}
				onSubmit={(e) => {
					e.preventDefault();
					saveHandler();
				}}
			>
				<ImagePicker file={photo} onChange={setPhoto} current={form.memberImage || null} label="Profile photo" />
				<div className="pb-form-grid">
					{field('memberNick', 'Nickname', { minLength: 3, maxLength: 12, required: true })}
					{field('memberFullName', 'Full name', { maxLength: 100 })}
					{field('memberPhone', 'Phone', { required: true })}
					{field('memberAddress', 'Address')}
				</div>
				<label className="pb-field">
					<span>About me</span>
					<textarea className="pb-textarea" rows={3} value={form.memberDesc ?? ''} onChange={(e) => setForm({ ...form, memberDesc: e.target.value })} />
				</label>
				{doctor && (
					<fieldset className="pb-profile-doctor">
						<legend>
							Doctor profile
							<span className={`pb-badge ${clinicName ? 'pb-badge--success' : 'pb-badge--warning'}`}>{clinicName || 'No clinic yet'}</span>
						</legend>
						<div className="pb-form-grid">
							<label className="pb-field">
								<span>Specialty</span>
								<select className="pb-select" value={doctor.specialty} onChange={(e) => setDoctor({ ...doctor, specialty: e.target.value as DoctorSpecialty })}>
									{Object.values(DoctorSpecialty).map((specialty) => (
										<option key={specialty} value={specialty}>
											{formatEnum(specialty)}
										</option>
									))}
								</select>
							</label>
							<label className="pb-field">
								<span>Experience (years)</span>
								<input
									className="pb-input"
									type="number"
									min={0}
									max={80}
									placeholder="0"
									value={doctor.experience || ''}
									onChange={(e) => setDoctor({ ...doctor, experience: Math.min(80, Math.max(0, parseInt(e.target.value, 10) || 0)) })}
								/>
							</label>
						</div>
					</fieldset>
				)}
				<div className="pb-form-actions">
					<button type="submit" className="pb-btn pb-btn--primary" disabled={saving || savingDoctor || uploading || problems.length > 0}>
						{saving || savingDoctor || uploading ? <EcgLine small /> : 'Save profile'}
					</button>
					{problems.length > 0 && <p className="pb-form-hint">To save: {problems.join('; ')}.</p>}
				</div>
			</form>
		</MySection>
	);
};

export default MyProfile;
