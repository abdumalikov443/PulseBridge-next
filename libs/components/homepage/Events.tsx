import React from 'react';
import { Stack, Box } from '@mui/material';
import useDeviceDetect from '../../hooks/useDeviceDetect';

interface EventData {
	eventTitle: string;
	city: string;
	description: string;
	imageSrc: string;
}
const eventsData: EventData[] = [
	{
		eventTitle: 'Free Heart Health Check Day',
		city: 'Incheon',
		description: 'Cardiologists offer free blood pressure and ECG screening for all visitors.',
		imageSrc: '/img/events/INCHEON.webp',
	},
	{
		eventTitle: 'Children Vaccination Week',
		city: 'Seoul',
		description: 'Pediatric clinics across the city run walk-in vaccination days for children.',
		imageSrc: '/img/events/SEOUL.webp',
	},
	{
		eventTitle: 'Skin Care Awareness Fair',
		city: 'Daegu',
		description: 'Dermatologists share sun protection tips and offer quick skin checks.',
		imageSrc: '/img/events/DAEGU.webp',
	},
	{
		eventTitle: 'Healthy Smile Festival',
		city: 'Busan',
		description: 'Dental clinics give free check-ups and oral hygiene workshops by the beach.',
		imageSrc: '/img/events/BUSAN.webp',
	},
];

const EventCard = ({ event }: { event: EventData }) => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>EVENT CARD</div>;
	} else {
		return (
			<Stack
				className="event-card"
				style={{
					backgroundImage: `url(${event?.imageSrc})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
				}}
			>
				<Box component={'div'} className={'info'}>
					<strong>{event?.city}</strong>
					<span>{event?.eventTitle}</span>
				</Box>
				<Box component={'div'} className={'more'}>
					<span>{event?.description}</span>
				</Box>
			</Stack>
		);
	}
};

const Events = () => {
	const device = useDeviceDetect();

	if (device === 'mobile') {
		return <div>EVENT CARD</div>;
	} else {
		return (
			<Stack className={'events'}>
				<Stack className={'container'}>
					<Stack className={'info-box'}>
						<Box component={'div'} className={'left'}>
							<span className={'white'}>Events</span>
							<p className={'white'}>Events waiting your attention!</p>
						</Box>
					</Stack>
					<Stack className={'card-wrapper'}>
						{eventsData.map((event: EventData) => {
							return <EventCard event={event} key={event?.eventTitle} />;
						})}
					</Stack>
				</Stack>
			</Stack>
		);
	}
};

export default Events;
