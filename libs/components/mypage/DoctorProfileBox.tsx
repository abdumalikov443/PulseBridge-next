import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_MY_DOCTOR_PROFILE } from '../../../apollo/user/query';
import { UPDATE_DOCTOR } from '../../../apollo/user/mutation';
import { DoctorSpecialty } from '../../enums/doctor.enum';
import { DoctorUpdate } from '../../types/doctor/doctor.update';
import { T } from '../../types/common';
import { formatEnum } from '../../utils';
import { sweetErrorHandling, sweetMixinSuccessAlert } from '../../sweetAlert';
import { EcgLine } from '../ui/Loaders';

// DOCTOR members: specialty and experience of the doctor profile created at signup
const DoctorProfileBox = () => {
	const [doctor, setDoctor] = useState<DoctorUpdate | null>(null);
	const [clinicName, setClinicName] = useState('');

	/** APOLLO REQUESTS **/
	const [updateDoctor, { loading }] = useMutation(UPDATE_DOCTOR);
	useQuery(GET_MY_DOCTOR_PROFILE, {
		fetchPolicy: 'network-only',
		onCompleted: (data: T) => {
			const value = data?.getMyDoctorProfile;
			if (!value) return;
			setDoctor({ _id: value._id, specialty: value.specialty, experience: value.experience });
			setClinicName(value.clinicData?.clinicName ?? '');
		},
	});

	/** HANDLERS **/
	const saveHandler = async () => {
		try {
			if (!doctor) return;
			await updateDoctor({ variables: { input: doctor } });
			await sweetMixinSuccessAlert('Doctor profile updated');
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	if (!doctor) return null;

	return (
		<form
			className="pb-card pb-card--flat"
			style={{ gap: 16 }}
			onSubmit={(e) => {
				e.preventDefault();
				saveHandler();
			}}
		>
			<div className="pb-section-head" style={{ marginBottom: 0 }}>
				<h2 className="pb-title" style={{ fontSize: 20 }}>
					Doctor profile
				</h2>
				<span className={`pb-badge ${clinicName ? 'pb-badge--success' : 'pb-badge--warning'}`}>{clinicName || 'No clinic yet'}</span>
			</div>
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
			<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
				<button type="submit" className="pb-btn pb-btn--primary" disabled={loading}>
					{loading ? <EcgLine small /> : 'Save doctor profile'}
				</button>
			</div>
		</form>
	);
};

export default DoctorProfileBox;
