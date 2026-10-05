import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { Doctor } from '../../types/doctor/doctor';
import { getImageUrl, getMemberName, TOP_RANK } from '../../config';
import { formatEnum } from '../../utils';
import { useRouter } from 'next/router';

interface PopularDoctorCardProps {
	doctor: Doctor;
}

const PopularDoctorCard = (props: PopularDoctorCardProps) => {
	const { doctor } = props;
	const router = useRouter();

	/** HANDLERS **/

	const pushDetailHandler = (doctorId: string) => {
		router.push(`/doctor/detail?id=${doctorId}`);
	};

	return (
		<Stack className="popular-card-box" onClick={() => pushDetailHandler(doctor?._id)}>
			<Box
				component={'div'}
				className={'card-img'}
				style={{ backgroundImage: `url(${getImageUrl(doctor?.memberData?.memberImage)})` }}
			>
				{doctor?.doctorRank >= TOP_RANK ? (
					<div className={'status'}>
						<img src="/img/icons/electricity.svg" alt="" />
						<span>top</span>
					</div>
				) : (
					''
				)}
				<div className={'price'}>{formatEnum(doctor?.specialty)}</div>
			</Box>
			<Box component={'div'} className={'info'}>
				<strong className={'title'}>{getMemberName(doctor?.memberData)}</strong>
				<p className={'desc'}>{doctor?.clinicData?.clinicName}</p>
				<div className={'options'}>
					<div>
						<img src="/img/icons/investment.svg" alt="" />
						<span>{doctor?.experience} years</span>
					</div>
					<div>
						<img src="/img/icons/like.svg" alt="" />
						<span>{doctor?.doctorLikes} likes</span>
					</div>
					<div>
						<img src="/img/icons/review.svg" alt="" />
						<span>{doctor?.doctorComments} reviews</span>
					</div>
				</div>
				<Divider sx={{ mt: '15px', mb: '17px' }} />
				<div className={'bott'}>
					<p>{formatEnum(doctor?.specialty)}</p>
					<div className="view-like-box">
						<IconButton color={'default'}>
							<RemoveRedEyeIcon />
						</IconButton>
						<Typography className="view-cnt">{doctor?.doctorViews}</Typography>
					</div>
				</div>
			</Box>
		</Stack>
	);
};

export default PopularDoctorCard;
