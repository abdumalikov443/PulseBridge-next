import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { updateStorage, updateUserInfo } from '../../auth';
import { MemberUpdate } from '../../types/member/member.update';
import { MemberType } from '../../enums/member.enum';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { Messages } from '../../config';
import { uploadImage } from '../../upload';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import MySection from './MySection';
import DoctorProfileBox from './DoctorProfileBox';
import Avatar from '../ui/Avatar';
import { EcgLine } from '../ui/Loaders';

const MyProfile = () => {
	const user = useReactiveVar(userVar);
	const inputRef = useRef<HTMLInputElement>(null);
	const [form, setForm] = useState<MemberUpdate>({ _id: '' });
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
	const uploadHandler = async () => {
		try {
			const file = inputRef.current?.files?.[0];
			if (!file) return;
			setUploading(true);
			const memberImage = await uploadImage(file, 'member');
			setForm((prev) => ({ ...prev, memberImage }));
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		} finally {
			setUploading(false);
		}
	};

	const saveHandler = async () => {
		try {
			if (!user?._id) throw new Error(Messages.error2);
			const input: MemberUpdate = { ...form, _id: user._id };
			(Object.keys(input) as (keyof MemberUpdate)[]).forEach((key) => input[key] === '' && delete input[key]);
			const result = await updateMember({ variables: { input } });
			const jwtToken = result.data?.updateMember?.accessToken;
			if (jwtToken) {
				updateStorage({ jwtToken });
				updateUserInfo(jwtToken);
			}
			await sweetMixinSuccessAlert('Profile updated');
		} catch (err: any) {
			sweetErrorHandling(err).then();
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
				<div className="pb-photo-pick">
					<Avatar name={form.memberFullName || form.memberNick} image={form.memberImage || null} size={88} />
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						<button type="button" className="pb-btn pb-btn--outline pb-btn--sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
							{uploading ? <EcgLine small width={44} /> : 'Upload photo'}
						</button>
						<span style={{ fontSize: 12, color: 'var(--pb-muted)' }}>JPG or PNG</span>
						<input ref={inputRef} type="file" hidden accept="image/jpg, image/jpeg, image/png" onChange={uploadHandler} />
					</div>
				</div>
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
					<button type="submit" className="pb-btn pb-btn--primary" disabled={saving || !form.memberNick || !form.memberPhone}>
						{saving ? <EcgLine small /> : 'Save profile'}
					</button>
				</div>
			</form>
			{user.memberType === MemberType.DOCTOR && <DoctorProfileBox />}
		</MySection>
	);
};

export default MyProfile;
