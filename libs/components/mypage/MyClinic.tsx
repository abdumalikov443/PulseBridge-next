import React, { useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { ClinicStatus, ClinicType } from '../../enums/clinic.enum';
import { ClinicUpdate } from '../../types/clinic/clinic.update';
import { formatEnum } from '../../utils';
import { uploadImage } from '../../upload';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { saveMemberImage } from '../../memberPhoto';
import { UPDATE_CLINIC } from '../../../apollo/user/mutation';
import { GET_MY_CLINIC } from '../../../apollo/user/query';
import { T } from '../../types/common';
import MySection from './MySection';
import ImagePicker from '../ui/ImagePicker';
import ScheduleFields from '../common/ScheduleFields';
import { scheduleError, withScheduleDefaults } from '../../schedule';
import { EcgLine, SkeletonCards } from '../ui/Loaders';

// CLINIC members only: the clinic is created at signup, here it is edited
const MyClinic = () => {
	const apollo = useApolloClient();
	// new photo waits here until Save
	const [photo, setPhoto] = useState<File | null>(null);
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
				...withScheduleDefaults(value),
			});
		},
		onError: () => setMissing(true),
	});

	/** HANDLERS **/
	const invalid =
		!clinic ||
		(clinic.clinicName ?? '').trim().length < 3 ||
		(clinic.clinicAddress ?? '').trim().length < 3 ||
		(clinic.clinicDesc ?? '').trim().length < 5 ||
		!!scheduleError(withScheduleDefaults(clinic));

	const saveHandler = async () => {
		try {
			if (!clinic) return;
			const input: ClinicUpdate = { ...clinic };
			if (photo) {
				setUploading(true);
				input.clinicImage = await uploadImage(photo, 'clinic');
			}
			if (!input.clinicImage) delete input.clinicImage;
			await updateClinic({ variables: { input } });
			if (photo && input.clinicImage) {
				// the clinic photo is also the account avatar
				await saveMemberImage(apollo, input.clinicImage);
				setClinic({ ...clinic, clinicImage: input.clinicImage });
				setPhoto(null);
			}
			await sweetMixinSuccessAlert('Clinic has been updated');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		} finally {
			setUploading(false);
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
					<ImagePicker file={photo} onChange={setPhoto} current={clinic.clinicImage || null} label="Clinic photo" hint="Shown on your clinic card and as your account photo" shape="wide" />

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
					<ScheduleFields value={withScheduleDefaults(clinic)} onChange={(schedule) => setClinic({ ...clinic, ...schedule })} />
					<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<button type="submit" className="pb-btn pb-btn--primary" disabled={invalid || saving || uploading}>
							{saving || uploading ? <EcgLine small /> : 'Save changes'}
						</button>
					</div>
				</form>
			)}
		</MySection>
	);
};

export default MyClinic;
