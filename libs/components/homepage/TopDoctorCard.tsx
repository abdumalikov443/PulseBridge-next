import React from 'react';
import { useRouter } from 'next/router';
import { Stack } from '@mui/material';
import { Doctor } from '../../types/doctor/doctor';
import { getImageUrl, getMemberName } from '../../config';
import { formatEnum } from '../../utils';

interface TopDoctorProps {
	doctor: Doctor;
}

const TopDoctorCard = (props: TopDoctorProps) => {
	const { doctor } = props;
	const router = useRouter();

	return (
		<Stack className="top-agent-card" onClick={() => router.push(`/doctor/detail?id=${doctor?._id}`)}>
			<img src={getImageUrl(doctor?.memberData?.memberImage)} alt="" />
			<strong>{getMemberName(doctor?.memberData)}</strong>
			<span>{formatEnum(doctor?.specialty)}</span>
		</Stack>
	);
};

export default TopDoctorCard;
