import React, { useEffect, useState } from 'react';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { updateStorage, updateUserInfo } from '../../auth';
import { MemberUpdate } from '../../types/member/member.update';
import { MemberType } from '../../enums/member.enum';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { Messages } from '../../config';
import { uploadImage } from '../../upload';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import MySection from './MySection';
import DoctorProfileBox from './DoctorProfileBox';
import ImagePicker from '../ui/ImagePicker';
import { EcgLine } from '../ui/Loaders';

const MyProfile = () => {
	const user = useReactiveVar(userVar);
	const [form, setForm] = useState<MemberUpdate>({ _id: '' });
	// new photo waits here until Save
	const [photo, setPhoto] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);

	/** APOLLO REQUESTS **/
	const [updateMember, { loading: saving }] = useMutation(UPDATE_MEMBER);

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
			(Object.keys(input) as (keyof MemberUpdate)[]).forEach((key) => input[key] === '' && delete input[key]);
			const result = await updateMember({ variables: { input } });
			const jwtToken = result.data?.updateMember?.accessToken;
			if (jwtToken) {
				updateStorage({ jwtToken });
				updateUserInfo(jwtToken);
			}
			setPhoto(null);
			await sweetMixinSuccessAlert('Profile updated');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setUploading(false);
		}
	};

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
				<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
					<button type="submit" className="pb-btn pb-btn--primary" disabled={saving || uploading || !form.memberNick || !form.memberPhone}>
						{saving || uploading ? <EcgLine small /> : 'Save profile'}
					</button>
				</div>
			</form>
			{user.memberType === MemberType.DOCTOR && <DoctorProfileBox />}
		</MySection>
	);
};

export default MyProfile;
