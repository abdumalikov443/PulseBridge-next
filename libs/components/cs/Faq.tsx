import React, { SyntheticEvent, useState } from 'react';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import { AccordionDetails, Box, Stack, Typography } from '@mui/material';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { useRouter } from 'next/router';
import { styled } from '@mui/material/styles';
import useDeviceDetect from '../../hooks/useDeviceDetect';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
	({ theme }) => ({
		border: `1px solid ${theme.palette.divider}`,
		'&:not(:last-child)': {
			borderBottom: 0,
		},
		'&:before': {
			display: 'none',
		},
	}),
);
const AccordionSummary = styled((props: AccordionSummaryProps) => (
	<MuiAccordionSummary expandIcon={<KeyboardArrowDownRoundedIcon sx={{ fontSize: '1.4rem' }} />} {...props} />
))(({ theme }) => ({
	backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : '#fff',
	'& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
		transform: 'rotate(180deg)',
	},
	'& .MuiAccordionSummary-content': {
		marginLeft: theme.spacing(1),
	},
}));

const categoryList: [string, string][] = [['clinics', 'Clinics'], ['doctors', 'Doctors'], ['appointments', 'Appointments'], ['community', 'Community'], ['other', 'Other']];

const Faq = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const [category, setCategory] = useState<string>('clinics');
	const [expanded, setExpanded] = useState<string | false>('panel1');

	/** APOLLO REQUESTS **/
	/** LIFECYCLES **/
	
	/** HANDLERS **/
	const changeCategoryHandler = (category: string) => {
		setCategory(category);
	};

	const handleChange = (panel: string) => (event: SyntheticEvent, newExpanded: boolean) => {
		setExpanded(newExpanded ? panel : false);
	};

	const data: any = {
		clinics: [
			{
				id: 'faq-01',
				subject: "How do I find a clinic?",
				content: "Open the Clinics page and search by name or filter by clinic type (private or public).",
			},
			{
				id: 'faq-02',
				subject: "Are the clinics on PulseBridge verified?",
				content: "Every clinic is registered by its owner and can be paused or removed by our admins.",
			},
			{
				id: 'faq-03',
				subject: "How can I register my clinic?",
				content: "Sign up with the Clinic role and fill in the clinic name, type, address and description.",
			},
		],
		doctors: [
			{
				id: 'faq-04',
				subject: "How do I find the right doctor?",
				content: "Open the Doctors page and filter by specialty, or search by the doctor name.",
			},
			{
				id: 'faq-05',
				subject: "How does a doctor join a clinic?",
				content: "A doctor sends a join request from My Page; the clinic owner approves or rejects it.",
			},
			{
				id: 'faq-06',
				subject: "Why can I not book some doctors?",
				content: "Only doctors who work in an active clinic can be booked.",
			},
		],
		appointments: [
			{
				id: 'faq-07',
				subject: "How do I book an appointment?",
				content: "Log in as a patient, open a doctor page and choose a free date and time.",
			},
			{
				id: 'faq-08',
				subject: "Can I cancel my appointment?",
				content: "Yes, open My Page > Appointments and cancel a confirmed appointment.",
			},
			{
				id: 'faq-09',
				subject: "Who completes an appointment?",
				content: "The doctor or the clinic owner marks the appointment as completed after the visit.",
			},
		],
		community: [
			{
				id: 'faq-10',
				subject: "What can I post in the community?",
				content: "Short health articles, tips and questions. Please be respectful and avoid medical misinformation.",
			},
			{
				id: 'faq-11',
				subject: "Is community content medical advice?",
				content: "No. Always consult a doctor for diagnosis and treatment.",
			},
		],
		other: [
			{
				id: 'faq-12',
				subject: "How do notifications work?",
				content: "You get notifications for likes, comments, follows, appointments and join requests.",
			},
			{
				id: 'faq-13',
				subject: "How do I contact support?",
				content: "Use the 1:1 inquiry section of the CS page.",
			},
		],
	};

	if (device === 'mobile') {
		return <div>FAQ MOBILE</div>;
	} else {
		return (
			<Stack className={'faq-content'}>
				<Box className={'categories'} component={'div'}>
					{categoryList.map(([key, title]) => (
						<div key={key} className={category === key ? 'active' : ''} onClick={() => changeCategoryHandler(key)}>
							{title}
						</div>
					))}
				</Box>
				<Box className={'wrap'} component={'div'}>
					{data[category] &&
						data[category].map((ele: any) => (
							<Accordion expanded={expanded === ele?.id} onChange={handleChange(ele?.id)} key={ele?.subject}>
								<AccordionSummary id="panel1d-header" className="question" aria-controls="panel1d-content">
									<Typography className="badge" variant={'h4'}>
										Q
									</Typography>
									<Typography> {ele?.subject}</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Stack className={'answer flex-box'}>
										<Typography className="badge" variant={'h4'} color={'primary'}>
											A
										</Typography>
										<Typography> {ele?.content}</Typography>
									</Stack>
								</AccordionDetails>
							</Accordion>
						))}
				</Box>
			</Stack>
		);
	}
};

export default Faq;
