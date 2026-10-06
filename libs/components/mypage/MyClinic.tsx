import React, { useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ClinicStatus, ClinicType } from '../../enums/clinic.enum';
import { REACT_APP_API_URL } from '../../config';
import { ClinicUpdate } from '../../types/clinic/clinic.update';
import { formatEnum } from '../../utils';
import { uploadImage } from '../../upload';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { UPDATE_CLINIC } from '../../../apollo/user/mutation';
import { GET_MY_CLINIC } from '../../../apollo/user/query';
import { T } from '../../types/common';
import MySection from './MySection';
import Icon from '../ui/Icon';
import { EcgLine, SkeletonCards } from '../ui/Loaders';

// CLINIC members only: the clinic is created at signup, here it is edited
const MyClinic = () => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [clinic, setClinic] = useState<ClinicUpdate | null>(null);
	const [missing, setMissing] = useState(false);
	const [uploading, setUploading] = useState(false);

	/** APOLLO REQUESTS **/
	const [updateClinic, { loading: saving }] = useMutation(UPDATE_CLINIC);

	useQuery(GET_MY_CLINIC, {
		fetchPolicy: 'network-only',
		onCompleted: (data: T) => {
			const value = data?.getMyClinic;
			if (!value) return setMissing(true);
			setClinic({
				_id: value._id,
				clinicStatus: value.clinicStatus,
				clinicType: value.clinicType,
				clinicName: value.clinicName,
				clinicAddress: value.clinicAddress,
				clinicDesc: value.clinicDesc,
				clinicImage: value.clinicImage ?? '',
			});
		},
		onError: () => setMissing(true),
	});

	/** HANDLERS **/
	const uploadHandler = async () => {
		try {
			const file = inputRef.current?.files?.[0];
			if (!file || !clinic) return;
			setUploading(true);
			const clinicImage = await uploadImage(file, 'clinic');
			setClinic({ ...clinic, clinicImage });
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		} finally {
			setUploading(false);
		}
	};

	const invalid =
		!clinic ||
		(clinic.clinicName ?? '').trim().length < 3 ||
		(clinic.clinicAddress ?? '').trim().length < 3 ||
		(clinic.clinicDesc ?? '').trim().length < 5;

	const saveHandler = async () => {
		try {
			if (!clinic) return;
			const input: ClinicUpdate = { ...clinic };
			if (!input.clinicImage) delete input.clinicImage;
			await updateClinic({ variables: { input } });
			await sweetMixinSuccessAlert('Clinic has been updated');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	if (missing) {
		return (
			<MySection title="My clinic">
				<p className="pb-empty">No clinic is linked to this account.</p>
			</MySection>
		);
	}

	return (
		<MySection title="My clinic" subTitle="Keep your clinic information up to date">
			{!clinic ? (
				<SkeletonCards count={1} />
			) : (
				<form
					className="pb-card pb-card--flat"
					style={{ gap: 18 }}
					onSubmit={(e) => {
						e.preventDefault();
						saveHandler();
					}}
				>
					<div className="pb-photo-pick">
						<div className="pb-media" style={{ width: 220, height: 140, background: 'var(--pb-soft-1)' }}>
							{clinic.clinicImage ? (
								<img src={`${REACT_APP_API_URL}/${clinic.clinicImage}`} alt="" />
							) : (
								<span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(31,111,153,.45)' }}>
									<Icon name="clinic" size={44} strokeWidth={1.4} />
								</span>
							)}
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							<button type="button" className="pb-btn pb-btn--outline pb-btn--sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
								{uploading ? <EcgLine small width={44} /> : 'Upload photo'}
							</button>
							<span style={{ fontSize: 12, color: 'var(--pb-muted)' }}>JPG or PNG</span>
							<input ref={inputRef} type="file" hidden accept="image/jpg, image/jpeg, image/png" onChange={uploadHandler} />
						</div>
					</div>

					<div className="pb-form-grid">
						<label className="pb-field">
							<span>Clinic name</span>
							<input className="pb-input" maxLength={100} value={clinic.clinicName} onChange={(e) => setClinic({ ...clinic, clinicName: e.target.value })} />
						</label>
						<label className="pb-field">
							<span>Address</span>
							<input className="pb-input" maxLength={100} value={clinic.clinicAddress} onChange={(e) => setClinic({ ...clinic, clinicAddress: e.target.value })} />
						</label>
						<label className="pb-field">
							<span>Type</span>
							<select className="pb-select" value={clinic.clinicType} onChange={(e) => setClinic({ ...clinic, clinicType: e.target.value as ClinicType })}>
								{Object.values(ClinicType).map((type) => (
									<option key={type} value={type}>
										{formatEnum(type)}
									</option>
								))}
							</select>
						</label>
						<label className="pb-field">
							<span>Status</span>
							<select className="pb-select" value={clinic.clinicStatus} onChange={(e) => setClinic({ ...clinic, clinicStatus: e.target.value as ClinicStatus })}>
								<option value={ClinicStatus.ACTIVE}>Active</option>
								<option value={ClinicStatus.PAUSE}>Paused</option>
							</select>
						</label>
					</div>
					<label className="pb-field">
						<span>Description</span>
						<textarea className="pb-textarea" rows={5} maxLength={500} value={clinic.clinicDesc} onChange={(e) => setClinic({ ...clinic, clinicDesc: e.target.value })} />
					</label>
					<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<button type="submit" className="pb-btn pb-btn--primary" disabled={invalid || saving}>
							{saving ? <EcgLine small /> : 'Save changes'}
						</button>
					</div>
				</form>
			)}
		</MySection>
	);
};

export default MyClinic;
