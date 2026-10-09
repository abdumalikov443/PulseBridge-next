import React, { useState } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import AdminTotal from '../../../libs/components/admin/AdminTotal';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import {
	Avatar,
	Box,
	Button,
	Divider,
	MenuItem,
	Select,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
} from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { Doctor } from '../../../libs/types/doctor/doctor';
import { DoctorsInquiry } from '../../../libs/types/doctor/doctor.input';
import { DoctorSpecialty } from '../../../libs/enums/doctor.enum';
import { T } from '../../../libs/types/common';
import { getImageUrl, getMemberName } from '../../../libs/config';
import { formatEnum } from '../../../libs/utils';
import { GET_DOCTORS } from '../../../apollo/user/query';
import { REMOVE_DOCTOR_BY_ADMIN } from '../../../apollo/admin/mutation';
import { sweetConfirmAlert, sweetErrorHandling } from '../../../libs/sweetAlert';

// getDoctors lists doctors working in an active clinic; removing detaches the doctor from the clinic
const AdminDoctors: NextPage = ({ initialInquiry, ...props }: any) => {
	const [doctorsInquiry, setDoctorsInquiry] = useState<DoctorsInquiry>(initialInquiry);
	const [doctors, setDoctors] = useState<Doctor[]>([]);
	const [total, setTotal] = useState<number>(0);
	const [specialty, setSpecialty] = useState<string>('ALL');

	/** APOLLO REQUESTS **/
	const [removeDoctorByAdmin] = useMutation(REMOVE_DOCTOR_BY_ADMIN);

	const { refetch: getDoctorsRefetch } = useQuery(GET_DOCTORS, {
		fetchPolicy: 'network-only',
		variables: { input: doctorsInquiry },
		notifyOnNetworkStatusChange: true,
		onCompleted: (data: T) => {
			setDoctors(data?.getDoctors?.list ?? []);
			setTotal(data?.getDoctors?.metaCounter[0]?.total ?? 0);
		},
	});

	/** HANDLERS **/

	const specialtyHandler = (value: string) => {
		setSpecialty(value);
		const search: T = { ...doctorsInquiry.search, specialtyList: [value] };
		if (value === 'ALL') delete search.specialtyList;
		setDoctorsInquiry({ ...doctorsInquiry, page: 1, search });
	};

	const removeDoctorHandler = async (doctor: Doctor) => {
		try {
			if (await sweetConfirmAlert(`Remove ${getMemberName(doctor.memberData)} from ${doctor.clinicData?.clinicName}?`)) {
				await removeDoctorByAdmin({ variables: { input: doctor._id } });
				await getDoctorsRefetch({ input: doctorsInquiry });
			}
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Box component={'div'} className={'content'}>
			<Typography variant={'h2'} className={'tit'} sx={{ mb: '24px' }}>
				Doctor List
				<AdminTotal total={total} noun="doctor" />
			</Typography>
			<Box component={'div'} className={'table-wrap'}>
				<Stack className={'search-area'} sx={{ m: '24px' }}>
					<Select sx={{ width: '200px' }} value={specialty}>
						<MenuItem value={'ALL'} onClick={() => specialtyHandler('ALL')}>
							ALL
						</MenuItem>
						{Object.values(DoctorSpecialty).map((value: string) => (
							<MenuItem value={value} key={value} onClick={() => specialtyHandler(value)}>
								{value}
							</MenuItem>
						))}
					</Select>
				</Stack>
				<Divider />
				<TableContainer>
					<Table sx={{ minWidth: 750 }} size={'medium'}>
						<TableHead>
							<TableRow>
								<TableCell align="left">DOCTOR</TableCell>
								<TableCell align="center">SPECIALTY</TableCell>
								<TableCell align="center">EXPERIENCE</TableCell>
								<TableCell align="center">CLINIC</TableCell>
								<TableCell align="center">LIKES / VIEWS</TableCell>
								<TableCell align="center">ACTION</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{doctors.length === 0 && (
								<TableRow>
									<TableCell align="center" colSpan={6}>
										<span className={'no-data'}>data not found!</span>
									</TableCell>
								</TableRow>
							)}
							{doctors.map((doctor: Doctor) => (
								<TableRow hover key={doctor._id}>
									<TableCell align="left" className={'name'}>
										<Stack direction={'row'} alignItems={'center'}>
											<Avatar src={getImageUrl(doctor.memberData?.memberImage)} sx={{ mr: '10px' }} />
											<Link href={`/doctor/detail?id=${doctor._id}`}>{getMemberName(doctor.memberData)}</Link>
										</Stack>
									</TableCell>
									<TableCell align="center">{formatEnum(doctor.specialty)}</TableCell>
									<TableCell align="center">{doctor.experience} years</TableCell>
									<TableCell align="center">{doctor.clinicData?.clinicName}</TableCell>
									<TableCell align="center">
										{doctor.doctorLikes} / {doctor.doctorViews}
									</TableCell>
									<TableCell align="center">
										<Button className={'badge warning'} onClick={() => removeDoctorHandler(doctor)}>
											Detach
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
				<TablePagination
					rowsPerPageOptions={[10, 20, 40]}
					component="div"
					count={total}
					rowsPerPage={doctorsInquiry.limit}
					page={doctorsInquiry.page - 1}
					onPageChange={(e: unknown, page: number) => setDoctorsInquiry({ ...doctorsInquiry, page: page + 1 })}
					onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setDoctorsInquiry({ ...doctorsInquiry, page: 1, limit: parseInt(e.target.value, 10) })
					}
				/>
			</Box>
		</Box>
	);
};

AdminDoctors.defaultProps = {
	initialInquiry: {
		page: 1,
		limit: 10,
		sort: 'createdAt',
		direction: 'DESC',
		search: {},
	},
};

export default withAdminLayout(AdminDoctors);
