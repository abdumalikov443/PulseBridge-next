import React, { useState } from 'react';
import { Box, Button, Modal, Stack, Typography, MenuItem, Select, TextField } from '@mui/material';
import moment from 'moment';
import { useMutation } from '@apollo/client';
import { CREATE_APPOINTMENT } from '../../../apollo/user/mutation';
import { AppointmentInput } from '../../types/appointment/appointment.input';
import { sweetErrorHandling, sweetTopSuccessAlert } from '../../sweetAlert';

// 09:00 - 17:30 every 30 minutes
const timeSlots: string[] = Array.from({ length: 18 }, (_, i) => {
	const hour = 9 + Math.floor(i / 2);
	return `${String(hour).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}`;
});

const style = {
	position: 'absolute' as 'absolute',
	top: '50%',
	left: '50%',
	transform: 'translate(-50%, -50%)',
	width: 420,
	bgcolor: 'background.paper',
	borderRadius: '12px',
	boxShadow: 24,
	p: 4,
};

interface BookAppointmentProps {
	open: boolean;
	doctorId: string;
	doctorName: string;
	onClose: () => void;
}

// patients only: the backend rejects past slots, taken slots and booking yourself
const BookAppointment = (props: BookAppointmentProps) => {
	const { open, doctorId, doctorName, onClose } = props;
	const today = moment().format('YYYY-MM-DD');
	const [input, setInput] = useState<AppointmentInput>({
		doctorId,
		appointmentDate: today,
		appointmentTime: timeSlots[0],
		appointmentReason: '',
	});

	/** APOLLO REQUESTS **/
	const [createAppointment, { loading }] = useMutation(CREATE_APPOINTMENT);

	/** HANDLERS **/

	const isPastSlot = (time: string) => moment(`${input.appointmentDate} ${time}`, 'YYYY-MM-DD HH:mm').isBefore(moment());

	const submitHandler = async () => {
		try {
			const reason = input.appointmentReason?.trim();
			if (reason && reason.length < 3) throw new Error('Reason must be at least 3 characters');
			await createAppointment({
				variables: { input: { ...input, doctorId, appointmentReason: reason || undefined } },
			});
			onClose();
			await sweetTopSuccessAlert('Appointment booked!', 1500);
		} catch (err: any) {
			sweetErrorHandling(err).then();
		}
	};

	return (
		<Modal open={open} onClose={onClose}>
			{/* @ts-ignore */}
			<Box sx={style}>
				<Stack gap={'16px'}>
					<Typography variant={'h6'}>Book an appointment</Typography>
					<Typography>{doctorName}</Typography>
					<TextField
						label={'Date'}
						type={'date'}
						value={input.appointmentDate}
						inputProps={{ min: today }}
						InputLabelProps={{ shrink: true }}
						onChange={(e: any) => setInput({ ...input, appointmentDate: e.target.value })}
					/>
					<Select
						value={input.appointmentTime}
						onChange={(e: any) => setInput({ ...input, appointmentTime: e.target.value })}
					>
						{timeSlots.map((time: string) => (
							<MenuItem key={time} value={time} disabled={isPastSlot(time)}>
								{time}
							</MenuItem>
						))}
					</Select>
					<TextField
						label={'Reason (optional)'}
						multiline
						minRows={3}
						inputProps={{ maxLength: 500 }}
						value={input.appointmentReason}
						onChange={(e: any) => setInput({ ...input, appointmentReason: e.target.value })}
					/>
					<Stack direction={'row'} justifyContent={'flex-end'} gap={'8px'}>
						<Button onClick={onClose}>Cancel</Button>
						<Button
							variant={'contained'}
							disabled={loading || !input.appointmentDate || isPastSlot(input.appointmentTime)}
							onClick={submitHandler}
						>
							Book
						</Button>
					</Stack>
				</Stack>
			</Box>
		</Modal>
	);
};

export default BookAppointment;
