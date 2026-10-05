import React, { useRef, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { ClinicStatus, ClinicType } from '../../enums/clinic.enum';
import { DEFAULT_CLINIC_IMAGE, getImageUrl } from '../../config';
import { ClinicUpdate } from '../../types/clinic/clinic.update';
import { formatEnum } from '../../utils';
import { uploadImage } from '../../upload';
import { sweetErrorHandling, sweetMixinErrorAlert, sweetMixinSuccessAlert } from '../../sweetAlert';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_CLINIC } from '../../../apollo/user/mutation';
import { GET_MY_CLINIC } from '../../../apollo/user/query';
import { T } from '../../types/common';

// CLINIC members only: the clinic is created at signup, here it is edited
const MyClinic = () => {
	const device = useDeviceDetect();
	const inputRef = useRef<any>(null);
	const [clinicData, setClinicData] = useState<ClinicUpdate | null>(null);

	/** APOLLO REQUESTS **/
	const [updateClinic] = useMutation(UPDATE_CLINIC);

	const { refetch: getMyClinicRefetch } = useQuery(GET_MY_CLINIC, {
		fetchPolicy: 'network-only',
		onCompleted: (data: T) => {
			const clinic = data?.getMyClinic;
			if (clinic) {
				setClinicData({
					_id: clinic._id,
					clinicStatus: clinic.clinicStatus,
					clinicType: clinic.clinicType,
					clinicName: clinic.clinicName,
					clinicAddress: clinic.clinicAddress,
					clinicDesc: clinic.clinicDesc,
					clinicImage: clinic.clinicImage ?? '',
				});
			}
		},
	});

	/** HANDLERS **/

	const uploadImageHandler = async () => {
		try {
			const file = inputRef.current?.files?.[0];
			if (!file || !clinicData) return;
			const clinicImage = await uploadImage(file, 'clinic');
			setClinicData({ ...clinicData, clinicImage });
		} catch (err: any) {
			await sweetMixinErrorAlert(err.message);
		}
	};

	const doDisabledCheck = () => {
		return (
			!clinicData ||
			(clinicData.clinicName ?? '').trim().length < 3 ||
			(clinicData.clinicAddress ?? '').trim().length < 3 ||
			(clinicData.clinicDesc ?? '').trim().length < 5
		);
	};

	const updateClinicHandler = async () => {
		try {
			if (!clinicData) return;
			const input: ClinicUpdate = { ...clinicData };
			if (!input.clinicImage) delete input.clinicImage;
			await updateClinic({ variables: { input } });
			await getMyClinicRefetch();
			await sweetMixinSuccessAlert('Clinic has been updated successfully!');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	if (device === 'mobile') {
		return <div>MY CLINIC MOBILE PAGE</div>;
	}

	if (!clinicData) {
		return (
			<div id="add-property-page">
				<Stack className="main-title-box">
					<Typography className="main-title">My Clinic</Typography>
					<Typography className="sub-title">No clinic is linked to this account.</Typography>
				</Stack>
			</div>
		);
	}

	return (
		<div id="add-property-page">
			<Stack className="main-title-box">
				<Typography className="main-title">My Clinic</Typography>
				<Typography className="sub-title">Keep your clinic information up to date</Typography>
			</Stack>

			<div>
				<Stack className="config">
					<Stack className="description-box">
						<Stack className="config-column">
							<Typography className="title">Clinic Name</Typography>
							<input
								type="text"
								className="description-input"
								placeholder={'Clinic name'}
								maxLength={100}
								value={clinicData.clinicName}
								onChange={({ target: { value } }) => setClinicData({ ...clinicData, clinicName: value })}
							/>
						</Stack>
						<Stack className="config-row">
							<Stack className="price-year-after-price">
								<Typography className="title">Clinic Type</Typography>
								<select
									className={'select-description'}
									value={clinicData.clinicType}
									onChange={({ target: { value } }) => setClinicData({ ...clinicData, clinicType: value as ClinicType })}
								>
									{Object.values(ClinicType).map((type: ClinicType) => (
										<option value={type} key={type}>
											{formatEnum(type)}
										</option>
									))}
								</select>
								<div className={'divider'}></div>
								<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
							</Stack>
							<Stack className="price-year-after-price">
								<Typography className="title">Status</Typography>
								<select
									className={'select-description'}
									value={clinicData.clinicStatus}
									onChange={({ target: { value } }) =>
										setClinicData({ ...clinicData, clinicStatus: value as ClinicStatus })
									}
								>
									<option value={ClinicStatus.ACTIVE}>Active</option>
									<option value={ClinicStatus.PAUSE}>Paused</option>
								</select>
								<div className={'divider'}></div>
								<img src={'/img/icons/Vector.svg'} className={'arrow-down'} />
							</Stack>
						</Stack>
						<Stack className="config-column">
							<Typography className="title">Address</Typography>
							<input
								type="text"
								className="description-input"
								placeholder={'Address'}
								maxLength={100}
								value={clinicData.clinicAddress}
								onChange={({ target: { value } }) => setClinicData({ ...clinicData, clinicAddress: value })}
							/>
						</Stack>

						<Typography className="property-title">Clinic Description</Typography>
						<Stack className="config-column">
							<Typography className="title">Description</Typography>
							<textarea
								className="description-text"
								maxLength={500}
								value={clinicData.clinicDesc}
								onChange={({ target: { value } }) => setClinicData({ ...clinicData, clinicDesc: value })}
							></textarea>
						</Stack>
					</Stack>

					<Typography className="upload-title">Clinic photo</Typography>
					<Stack className="images-box">
						<Stack className="upload-box">
							<Stack className="text-box">
								<Typography className="drag-title">Upload a photo of your clinic</Typography>
								<Typography className="format-title">Photos must be JPEG or PNG format</Typography>
							</Stack>
							<Button className="browse-button" onClick={() => inputRef.current.click()}>
								<Typography className="browse-button-text">Browse Files</Typography>
								<input
									ref={inputRef}
									type="file"
									hidden={true}
									onChange={uploadImageHandler}
									accept="image/jpg, image/jpeg, image/png"
								/>
							</Button>
						</Stack>
						<Stack className="gallery-box">
							<Stack className="image-box">
								<img src={getImageUrl(clinicData.clinicImage, DEFAULT_CLINIC_IMAGE)} alt="" />
							</Stack>
						</Stack>
					</Stack>

					<Stack className="buttons-row">
						<Button className="next-button" disabled={doDisabledCheck()} onClick={updateClinicHandler}>
							<Typography className="next-button-text">Save</Typography>
						</Button>
					</Stack>
				</Stack>
			</div>
		</div>
	);
};

export default MyClinic;
