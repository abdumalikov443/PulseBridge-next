import React, { useState } from 'react';
import Icon from '../ui/Icon';

interface FaqItem {
	q: string;
	a: string;
}

const categories: { id: string; label: string; items: FaqItem[] }[] = [
	{
		id: 'clinics',
		label: 'Clinics',
		items: [
			{ q: 'How do I find a clinic?', a: 'Open the Clinics page and search by name or filter by clinic type (private or public).' },
			{ q: 'Are the clinics on PulseBridge verified?', a: 'Every clinic is registered by its owner and can be paused or removed by our admins.' },
			{ q: 'How can I register my clinic?', a: 'Sign up with the Clinic role and fill in the clinic name, type, address and description.' },
		],
	},
	{
		id: 'doctors',
		label: 'Doctors',
		items: [
			{ q: 'How do I find the right doctor?', a: 'Open the Doctors page and filter by specialty, or search by the doctor name.' },
			{ q: 'How does a doctor join a clinic?', a: 'A doctor sends a join request from My Page; the clinic owner approves or rejects it.' },
			{ q: 'Why can I not book some doctors?', a: 'Only doctors who work in an active clinic can be booked.' },
		],
	},
	{
		id: 'appointments',
		label: 'Appointments',
		items: [
			{ q: 'How do I book an appointment?', a: 'Log in as a patient, open a doctor page and choose a free date and time.' },
			{ q: 'Can I cancel my appointment?', a: 'Yes, open My Page > Appointments and cancel a confirmed appointment.' },
			{ q: 'Who completes an appointment?', a: 'The doctor or the clinic owner marks the appointment as completed after the visit.' },
		],
	},
	{
		id: 'community',
		label: 'Community',
		items: [
			{ q: 'What can I post in the community?', a: 'Short health articles, tips and questions. Please be respectful and avoid medical misinformation.' },
			{ q: 'Is community content medical advice?', a: 'No. Always consult a doctor for diagnosis and treatment.' },
		],
	},
	{
		id: 'other',
		label: 'Other',
		items: [
			{ q: 'How do notifications work?', a: 'You get notifications for likes, comments, follows, appointments and join requests.' },
			{ q: 'Is PulseBridge for emergencies?', a: 'No. In an emergency call 119 or go to the nearest emergency room.' },
		],
	},
];

const Faq = () => {
	const [category, setCategory] = useState(categories[0].id);
	const current = categories.find((item) => item.id === category) ?? categories[0];

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
			<div className="pb-pills" role="tablist" aria-label="FAQ topics">
				{categories.map((item) => (
					<button
						key={item.id}
						type="button"
						role="tab"
						aria-selected={category === item.id}
						className={`pb-pill ${category === item.id ? 'pb-pill--active' : ''}`}
						onClick={() => setCategory(item.id)}
					>
						{item.label}
					</button>
				))}
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
				{current.items.map((item, index) => (
					<details key={item.q} className="pb-faq pb-in" open={index === 0} style={{ animationDelay: `${index * 0.06}s` }}>
						<summary>
							{item.q}
							<Icon name="arrow" size={16} />
						</summary>
						<p>{item.a}</p>
					</details>
				))}
			</div>
		</div>
	);
};

export default Faq;
