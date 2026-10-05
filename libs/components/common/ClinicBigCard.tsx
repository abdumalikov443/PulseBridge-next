import React from 'react';
import { Stack, Box, Divider, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Clinic } from '../../types/clinic/clinic';
import { DEFAULT_CLINIC_IMAGE, getImageUrl, TOP_RANK } from '../../config';
import { formatEnum } from '../../utils';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { useRouter } from 'next/router';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

interface ClinicBigCardProps {
	clinic: Clinic;
	likeClinicHandler?: any;
}

const ClinicBigCard = (props: ClinicBigCardProps) => {
	const { clinic, likeClinicHandler } = props;
	const device = useDeviceDetect();
	const user = useReactiveVar(userVar);
	const router = useRouter();

	/** HANDLERS **/
	const pushDetailHandler = (clinicId: string) => {
		router.push(`/clinic/detail?id=${clinicId}`);
	};

	if (device === 'mobile') {
		return <div>CLINIC BIG CARD</div>;
	} else {
		return (
			<Stack className="property-big-card-box" onClick={() => pushDetailHandler(clinic?._id)}>
				<Box
					component={'div'}
					className={'card-img'}
					style={{ backgroundImage: `url(${getImageUrl(clinic?.clinicImage, DEFAULT_CLINIC_IMAGE)})` }}
				>
					{clinic?.clinicRank >= TOP_RANK && (
						<div className={'status'}>
							<img src="/img/icons/electricity.svg" alt="" />
							<span>top</span>
						</div>
					)}

					<div className={'price'}>{formatEnum(clinic?.clinicType)}</div>
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
						<div>
							<p>{formatEnum(clinic?.clinicType)}</p>
						</div>
						<div className="buttons-box">
							<IconButton color={'default'}>
								<RemoveRedEyeIcon />
							</IconButton>
							<Typography className="view-cnt">{clinic?.clinicViews}</Typography>
							<IconButton
								color={'default'}
								onClick={(e: any) => {
									e.stopPropagation();
									likeClinicHandler && likeClinicHandler(user, clinic?._id);
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
	}
};

export default ClinicBigCard;
