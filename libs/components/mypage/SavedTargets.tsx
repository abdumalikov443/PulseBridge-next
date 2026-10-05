import React, { useState } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Button, Pagination, Stack, Typography } from '@mui/material';
import { DocumentNode, useMutation, useQuery } from '@apollo/client';
import ClinicCard from '../clinic/ClinicCard';
import DoctorCard from '../common/DoctorCard';
import { Clinic } from '../../types/clinic/clinic';
import { Doctor } from '../../types/doctor/doctor';
import { OrdinaryInquiry, T } from '../../types/common';
import { LIKE_TARGET_CLINIC, LIKE_TARGET_DOCTOR } from '../../../apollo/user/mutation';
import { Messages } from '../../config';
import { sweetMixinErrorAlert } from '../../sweetAlert';

type Target = 'clinic' | 'doctor';

interface SavedTargetsProps {
	pageId: string;
	title: string;
	clinicQuery: DocumentNode;
	clinicResultKey: string;
	doctorQuery: DocumentNode;
	doctorResultKey: string;
	// favorites show filled hearts, recently visited hides like buttons
	myFavorites?: boolean;
	recentlyVisited?: boolean;
}

// clinics and doctors saved by the member: favorites or recently visited
const SavedTargets = (props: SavedTargetsProps) => {
	const { pageId, title, clinicQuery, clinicResultKey, doctorQuery, doctorResultKey, myFavorites, recentlyVisited } =
		props;
	const device = useDeviceDetect();
	const [target, setTarget] = useState<Target>('clinic');
	const [clinics, setClinics] = useState<Clinic[]>([]);
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [inquiry, setInquiry] = useState<OrdinaryInquiry>({ page: 1, limit: 6 });

	/** APOLLO REQUESTS **/
	const [likeTargetClinic] = useMutation(LIKE_TARGET_CLINIC);
	const [likeTargetDoctor] = useMutation(LIKE_TARGET_DOCTOR);

	const { refetch: clinicsRefetch } = useQuery(clinicQuery, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		skip: target !== 'clinic',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setClinics(data?.[clinicResultKey]?.list ?? []);
			setTotal(data?.[clinicResultKey]?.metaCounter[0]?.total || 0);
		},
	});

	const { refetch: doctorsRefetch } = useQuery(doctorQuery, {
		fetchPolicy: 'network-only',
		variables: { input: inquiry },
		skip: target !== 'doctor',
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setDoctors(data?.[doctorResultKey]?.list ?? []);
			setTotal(data?.[doctorResultKey]?.metaCounter[0]?.total || 0);
		},
	});

	/** HANDLERS **/

	const targetChangeHandler = (value: Target) => {
		setTarget(value);
		setTotal(0);
		setInquiry({ ...inquiry, page: 1 });
	};

	const paginationHandler = (e: T, value: number) => {
		setInquiry({ ...inquiry, page: value });
	};

	const likeClinicHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetClinic({ variables: { input: id } });
			await clinicsRefetch({ input: inquiry });
		} catch (err: any) {
			console.log('ERROR, likeClinicHandler: ', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const likeDoctorHandler = async (user: T, id: string) => {
		try {
			if (!id) return;
			if (!user._id) throw new Error(Messages.error2);
			await likeTargetDoctor({ variables: { input: id } });
			await doctorsRefetch({ input: inquiry });
		} catch (err: any) {
			console.log('ERROR, likeDoctorHandler: ', err.message);
			sweetMixinErrorAlert(err.message).then();
		}
	};

	const listLength = target === 'clinic' ? clinics.length : doctors.length;

	if (device === 'mobile') {
		return <div>{title.toUpperCase()} MOBILE</div>;
	} else {
		return (
			<div id={pageId}>
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">{title}</Typography>
						<Stack direction={'row'} gap={'8px'} mt={'8px'}>
							<Button variant={target === 'clinic' ? 'contained' : 'outlined'} onClick={() => targetChangeHandler('clinic')}>
								Clinics
							</Button>
							<Button variant={target === 'doctor' ? 'contained' : 'outlined'} onClick={() => targetChangeHandler('doctor')}>
								Doctors
							</Button>
						</Stack>
					</Stack>
				</Stack>
				<Stack className="favorites-list-box">
					{listLength === 0 && (
						<div className={'no-data'}>
							<img src="/img/icons/icoAlert.svg" alt="" />
							<p>No {target === 'clinic' ? 'clinics' : 'doctors'} found!</p>
						</div>
					)}
					{target === 'clinic' &&
						clinics.map((clinic: Clinic) => (
							<ClinicCard
								clinic={clinic}
								key={clinic._id}
								myFavorites={myFavorites}
								recentlyVisited={recentlyVisited}
								likeClinicHandler={likeClinicHandler}
							/>
						))}
					{target === 'doctor' &&
						doctors.map((doctor: Doctor) => (
							<DoctorCard
								doctor={doctor}
								key={doctor._id}
								likeDoctorHandler={recentlyVisited ? undefined : likeDoctorHandler}
							/>
						))}
				</Stack>
				{listLength ? (
					<Stack className="pagination-config">
						<Stack className="pagination-box">
							<Pagination
								count={Math.ceil(total / inquiry.limit)}
								page={inquiry.page}
								shape="circular"
								color="primary"
								onChange={paginationHandler}
							/>
						</Stack>
						<Stack className="total-result">
							<Typography>
								Total {total} {target === 'clinic' ? 'clinic' : 'doctor'}
								{total > 1 ? 's' : ''}
							</Typography>
						</Stack>
					</Stack>
				) : null}
			</div>
		);
	}
};

export default SavedTargets;
