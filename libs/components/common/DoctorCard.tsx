import React from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import { Stack, Box, Typography } from '@mui/material';
import Link from 'next/link';
import { getImageUrl, getMemberName } from '../../config';
import { formatEnum } from '../../utils';
import IconButton from '@mui/material/IconButton';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { Doctor } from '../../types/doctor/doctor';

interface DoctorCardProps {
	doctor: Doctor;
	likeDoctorHandler?: any;
}

const DoctorCard = (props: DoctorCardProps) => {
	const { doctor, likeDoctorHandler } = props;
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const detailLink = { pathname: '/doctor/detail', query: { id: doctor?._id } };

	if (device === 'mobile') {
		return <div>DOCTOR CARD</div>;
	} else {
		return (
			<Stack className="agent-general-card">
				<Link href={detailLink}>
					<Box
						component={'div'}
						className={'agent-img'}
						style={{
							backgroundImage: `url(${getImageUrl(doctor?.memberData?.memberImage)})`,
							backgroundSize: 'cover',
							backgroundPosition: 'center',
							backgroundRepeat: 'no-repeat',
						}}
					>
						<div>{doctor?.experience} years experience</div>
					</Box>
				</Link>

				<Stack className={'agent-desc'}>
					<Box component={'div'} className={'agent-info'}>
						<Link href={detailLink}>
							<strong>{getMemberName(doctor?.memberData)}</strong>
						</Link>
						<span>
							{formatEnum(doctor?.specialty)}
							{doctor?.clinicData?.clinicName ? ` · ${doctor.clinicData.clinicName}` : ''}
						</span>
					</Box>
					<Box component={'div'} className={'buttons'}>
						<IconButton color={'default'}>
							<RemoveRedEyeIcon />
						</IconButton>
						<Typography className="view-cnt">{doctor?.doctorViews}</Typography>
						{likeDoctorHandler && (
							<IconButton color={'default'} onClick={() => likeDoctorHandler(user, doctor?._id)}>
								{doctor?.meLiked && doctor?.meLiked[0]?.myFavorite ? (
									<FavoriteIcon color={'primary'} />
								) : (
									<FavoriteBorderIcon />
								)}
							</IconButton>
						)}
						<Typography className="view-cnt">{doctor?.doctorLikes}</Typography>
					</Box>
				</Stack>
			</Stack>
		);
	}
};

export default DoctorCard;
