import React, { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { GET_MY_DOCTOR_PROFILE } from '../../../apollo/user/query';
import { UPDATE_DOCTOR } from '../../../apollo/user/mutation';
import { DoctorSpecialty } from '../../enums/doctor.enum';
import { DoctorUpdate } from '../../types/doctor/doctor.update';
import { T } from '../../types/common';
import { formatEnum } from '../../utils';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';

// DOCTOR members: specialty and experience of the doctor profile created at signup
const DoctorProfileBox = () => {
	const [doctorData, setDoctorData] = useState<DoctorUpdate | null>(null);
	const [clinicName, setClinicName] = useState<string>('');

	/** APOLLO REQUESTS **/
	const [updateDoctor] = useMutation(UPDATE_DOCTOR);

	useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'network-only',
		onCompleted: (data: T) => {
			const doctor = data?.getMyDoctorProfile;
			if (!doctor) return;
			setDoctorData({ _id: doctor._id, specialty: doctor.specialty, experience: doctor.experience });
			setClinicName(doctor.clinicData?.clinicName ?? '');
		},
	});

	/** HANDLERS **/

	const updateDoctorHandler = async () => {
		try {
			if (!doctorData) return;
			await updateDoctor({ variables: { input: doctorData } });
			await sweetMixinSuccessAlert('Doctor profile updated successfully!');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	if (!doctorData) return null;

	return (
		<Stack className="small-input-box" sx={{ marginTop: '30px' }}>
			<Typography className="title">Doctor profile {clinicName ? `· ${clinicName}` : '· no clinic yet'}</Typography>
			<Stack direction={'row'} gap={'16px'} sx={{ marginTop: '12px' }}>
				<Stack className="input-box">
					<Typography className="title">Specialty</Typography>
					<select
						value={doctorData.specialty}
						onChange={({ target: { value } }) => setDoctorData({ ...doctorData, specialty: value as DoctorSpecialty })}
					>
						{Object.values(DoctorSpecialty).map((specialty: DoctorSpecialty) => (
							<option key={specialty} value={specialty}>
								{formatEnum(specialty)}
							</option>
						))}
					</select>
				</Stack>
				<Stack className="input-box">
					<Typography className="title">Experience (years)</Typography>
					<input
						type="number"
						min={0}
						value={doctorData.experience}
						onChange={({ target: { value } }) =>
							setDoctorData({ ...doctorData, experience: Math.max(0, parseInt(value || '0', 10)) })
						}
					/>
				</Stack>
			</Stack>
			<Stack className="about-me-box">
				<Button className="update-button" onClick={updateDoctorHandler}>
					<Typography>Update Doctor Profile</Typography>
				</Button>
			</Stack>
		</Stack>
	);
};

export default DoctorProfileBox;
