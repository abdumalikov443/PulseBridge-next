import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { Clinic } from '../../types/clinic/clinic';
import Link from 'next/link';
import { formatEnum } from '../../utils';
import { DEFAULT_CLINIC_IMAGE, getImageUrl, TOP_RANK } from '../../config';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import IconButton from '@mui/material/IconButton';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

interface ClinicCardType {
	clinic: Clinic;
	likeClinicHandler?: any;
	myFavorites?: boolean;
	recentlyVisited?: boolean;
}

const ClinicCard = (props: ClinicCardType) => {
	const { clinic, likeClinicHandler, myFavorites, recentlyVisited } = props;
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const imagePath: string = getImageUrl(clinic?.clinicImage, DEFAULT_CLINIC_IMAGE);
	const detailLink = { pathname: '/clinic/detail', query: { id: clinic?._id } };

	if (device === 'mobile') {
		return <div>CLINIC CARD</div>;
	} else {
		return (
			<Stack className="card-config">
				<Stack className="top">
					<Link href={detailLink}>
						<img src={imagePath} alt="" />
					</Link>
					{clinic?.clinicRank >= TOP_RANK && (
						<Box component={'div'} className={'top-badge'}>
							<img src="/img/icons/electricity.svg" alt="" />
							<Typography>TOP</Typography>
						</Box>
					)}
					<Box component={'div'} className={'price-box'}>
						<Typography>{formatEnum(clinic?.clinicType)}</Typography>
					</Box>
				</Stack>
				<Stack className="bottom">
					<Stack className="name-address">
						<Stack className="name">
							<Link href={detailLink}>
								<Typography>{clinic?.clinicName}</Typography>
							</Link>
						</Stack>
						<Stack className="address">
							<Typography>{clinic?.clinicAddress}</Typography>
						</Stack>
					</Stack>
					<Stack className="options">
						<Stack className="option">
							<img src="/img/icons/user.svg" alt="" /> <Typography>{clinic?.clinicDoctors} doctors</Typography>
						</Stack>
						<Stack className="option">
							<img src="/img/icons/review.svg" alt="" /> <Typography>{clinic?.clinicComments} reviews</Typography>
						</Stack>
					</Stack>
					<Stack className="divider"></Stack>
					<Stack className="type-buttons">
						<Stack className="type">
							<Typography sx={{ fontWeight: 500, fontSize: '13px' }}>{formatEnum(clinic?.clinicType)} clinic</Typography>
						</Stack>
						{!recentlyVisited && (
							<Stack className="buttons">
								<IconButton color={'default'}>
									<RemoveRedEyeIcon />
								</IconButton>
								<Typography className="view-cnt">{clinic?.clinicViews}</Typography>
								<IconButton color={'default'} onClick={() => likeClinicHandler && likeClinicHandler(user, clinic?._id)}>
									{myFavorites || (clinic?.meLiked && clinic?.meLiked[0]?.myFavorite) ? (
										<FavoriteIcon color="primary" />
									) : (
										<FavoriteBorderIcon />
									)}
								</IconButton>
								<Typography className="view-cnt">{clinic?.clinicLikes}</Typography>
							</Stack>
						)}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default ClinicCard;
