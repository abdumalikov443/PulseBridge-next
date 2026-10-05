import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { Clinic } from '../../types/clinic/clinic';
import { DEFAULT_CLINIC_IMAGE, getImageUrl } from '../../config';
import { formatEnum } from '../../utils';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';

interface ClinicSlideCardProps {
	clinic: Clinic;
	likeClinicHandler: any;
	// trend-card-box | top-card-box
	cardClass: string;
}

// clinic card used by the Trend and Top clinic sliders on the home page
const ClinicSlideCard = (props: ClinicSlideCardProps) => {
	const { clinic, likeClinicHandler, cardClass } = props;
	const router = useRouter();
	const user = useReactiveVar(userVar);

	/** HANDLERS **/

	const pushDetailHandler = (clinicId: string) => {
		router.push(`/clinic/detail?id=${clinicId}`);
	};

	return (
		<Stack className={cardClass} onClick={() => pushDetailHandler(clinic?._id)}>
			<Box
				component={'div'}
				className={'card-img'}
				style={{ backgroundImage: `url(${getImageUrl(clinic?.clinicImage, DEFAULT_CLINIC_IMAGE)})` }}
			>
				<div>{formatEnum(clinic?.clinicType)}</div>
			</Box>
			<Box component={'div'} className={'info'}>
				<strong className={'title'}>{clinic?.clinicName}</strong>
				<p className={'desc'}>{clinic?.clinicAddress}</p>
				<div className={'options'}>
					<div>
						<img src="/img/icons/user.svg" alt="" />
						<span>{clinic?.clinicDoctors} doctors</span>
					</div>
					<div>
						<img src="/img/icons/review.svg" alt="" />
						<span>{clinic?.clinicComments} reviews</span>
					</div>
				</div>
				<Divider sx={{ mt: '15px', mb: '17px' }} />
				<div className={'bott'}>
					<p>{formatEnum(clinic?.clinicType)} clinic</p>
					<div className="view-like-box">
						<IconButton color={'default'}>
							<RemoveRedEyeIcon />
						</IconButton>
						<Typography className="view-cnt">{clinic?.clinicViews}</Typography>
						<IconButton
							color={'default'}
							onClick={(e: any) => {
								e.stopPropagation();
								likeClinicHandler(user, clinic?._id);
							}}
						>
							{clinic?.meLiked && clinic?.meLiked[0]?.myFavorite ? (
								<FavoriteIcon style={{ color: 'red' }} />
							) : (
								<FavoriteIcon />
							)}
						</IconButton>
						<Typography className="view-cnt">{clinic?.clinicLikes}</Typography>
					</div>
				</div>
			</Box>
		</Stack>
	);
};

export default ClinicSlideCard;
