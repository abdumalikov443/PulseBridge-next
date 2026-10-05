import React, { useState } from 'react';
import { NextPage } from 'next';
import { Pagination, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import ListRow from './ListRow';
import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { Doctor } from '../../types/doctor/doctor';
import { DoctorsInquiry } from '../../types/doctor/doctor.input';
import { T } from '../../types/common';
import { getImageUrl, getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import { REMOVE_DOCTOR } from '../../../apollo/user/mutation';
import { GET_DOCTORS, GET_MY_CLINIC } from '../../../apollo/user/query';
import { sweetConfirmAlert, sweetErrorHandling } from '../../sweetAlert';

// CLINIC members: doctors working in my clinic; removing keeps the doctor profile, it only leaves the clinic
const ClinicDoctors: NextPage = ({ initialInput, ...props }: any) => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [searchFilter, setSearchFilter] = useState<DoctorsInquiry>(initialInput);
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [total, setTotal] = useState<number>(0);

	/** APOLLO REQUESTS **/
	const [removeDoctor] = useMutation(REMOVE_DOCTOR);

	useQuery(GET_MY_CLINIC, {
		fetchPolicy: 'network-only',
		onCompleted: (data: T) => {
			const clinicId = data?.getMyClinic?._id;
			if (clinicId) setSearchFilter({ ...searchFilter, search: { clinicId } });
		},
	});

	const { refetch: getDoctorsRefetch } = useQuery(GET_DOCTORS, {
		fetchPolicy: 'network-only',
		variables: { input: searchFilter },
		skip: !searchFilter.search.clinicId,
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setDoctors(data?.getDoctors?.list ?? []);
			setTotal(data?.getDoctors?.metaCounter[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/

	const paginationHandler = (e: T, value: number) => {
		setSearchFilter({ ...searchFilter, page: value });
	};

	const removeDoctorHandler = async (doctor: Doctor) => {
		try {
			if (await sweetConfirmAlert(`Remove ${getMemberName(doctor.memberData)} from your clinic?`)) {
				await removeDoctor({ variables: { input: doctor._id } });
				await getDoctorsRefetch({ input: searchFilter });
			}
		} catch (err: any) {
			await sweetErrorHandling(err);
		}
	};

	if (device === 'mobile') {
		return <div>CLINIC DOCTORS MOBILE</div>;
	} else {
		return (
			<div id="my-property-page">
				<Stack className="main-title-box">
					<Stack className="right-box">
						<Typography className="main-title">Doctors</Typography>
						<Typography className="sub-title">Doctors join your clinic through join requests</Typography>
					</Stack>
				</Stack>
				<Stack className="property-list-box">
					<Stack className="list-box">
						<Stack className="listing-title-box">
							<Typography className="title-text">Doctor</Typography>
							<Typography className="title-text">Joined PulseBridge</Typography>
							<Typography className="title-text">Specialty</Typography>
							<Typography className="title-text">Views</Typography>
							<Typography className="title-text">Action</Typography>
						</Stack>
						{doctors.length === 0 ? (
							<div className={'no-data'}>
								<img src="/img/icons/icoAlert.svg" alt="" />
								<p>No doctors yet!</p>
							</div>
						) : (
							doctors.map((doctor: Doctor) => (
								<ListRow
									key={doctor._id}
									image={getImageUrl(doctor.memberData?.memberImage)}
									title={getMemberName(doctor.memberData)}
									subTitle={`${doctor.experience} years experience`}
									date={doctor.createdAt}
									status={formatEnum(doctor.specialty)}
									count={doctor.doctorViews}
									onClick={() => router.push(`/doctor/detail?id=${doctor._id}`)}
									actions={
										<Tooltip title={'Remove from clinic'}>
											<IconButton className="icon-button" onClick={() => removeDoctorHandler(doctor)}>
												<PersonRemoveIcon className="buttons" />
											</IconButton>
										</Tooltip>
									}
								/>
							))
						)}
						{doctors.length !== 0 && (
							<Stack className="pagination-config">
								<Stack className="pagination-box">
									<Pagination
										count={Math.ceil(total / searchFilter.limit)}
										page={searchFilter.page}
										shape="circular"
										color="primary"
										onChange={paginationHandler}
									/>
								</Stack>
								<Stack className="total-result">
									<Typography>
										{total} doctor{total > 1 ? 's' : ''}
									</Typography>
								</Stack>
							</Stack>
						)}
					</Stack>
				</Stack>
			</div>
		);
	}
};

ClinicDoctors.defaultProps = {
	initialInput: {
		page: 1,
		limit: 5,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default ClinicDoctors;
