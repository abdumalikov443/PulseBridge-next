import { Stack, Typography } from '@mui/material';
import React, { ReactNode } from 'react';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import Moment from 'react-moment';

interface ListRowProps {
	image: string;
	title: string;
	subTitle?: string;
	extra?: ReactNode;
	date?: Date | string;
	// already formatted date (e.g. appointment day stored at UTC midnight)
	dateText?: string;
	dateFormat?: string;
	status: string;
	count?: ReactNode;
	actions?: ReactNode;
	onClick?: () => void;
}

// one row of the mypage tables (clinic doctors, appointments, join requests)
const ListRow = (props: ListRowProps) => {
	const { image, title, subTitle, extra, date, dateText, dateFormat = 'DD MMMM, YYYY', status, count, actions, onClick } = props;
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>MOBILE LIST ROW</div>;
	} else
		return (
			<Stack className="property-card-box">
				<Stack className="image-box" onClick={onClick}>
					<img src={image} alt="" />
				</Stack>
				<Stack className="information-box" onClick={onClick}>
					<Typography className="name">{title}</Typography>
					{subTitle && <Typography className="address">{subTitle}</Typography>}
					{extra && <Typography className="price">{extra}</Typography>}
				</Stack>
				<Stack className="date-box">
					<Typography className="date">
						{dateText ?? <Moment format={dateFormat}>{date}</Moment>}
					</Typography>
				</Stack>
				<Stack className="status-box">
					<Stack className="coloured-box" sx={{ background: '#E5F0FD' }}>
						<Typography className="status" sx={{ color: '#3554d1' }}>
							{status}
						</Typography>
					</Stack>
				</Stack>
				<Stack className="views-box">
					<Typography className="views">{count}</Typography>
				</Stack>
				{actions && <Stack className="action-box">{actions}</Stack>}
			</Stack>
		);
};

export default ListRow;
