import React from 'react';
import { useTranslation } from 'next-i18next';
import { openStatus, Schedule, WEEK_DAY_LABEL } from '../../schedule';

interface OpenStatusProps {
	clinic: Partial<Schedule>;
}

// "Open now · until 18:00" / "On a break · back at 14:00" / "Closed · opens …", from the clinic's hours in Seoul time
const OpenStatus = ({ clinic }: OpenStatusProps) => {
	const { t } = useTranslation('common');
	const status = openStatus(clinic);
	const text =
		status.state === 'open'
			? t('Open now · until {{time}}', { time: status.time })
			: status.state === 'break'
			? t('On a break · back at {{time}}', { time: status.time })
			: status.day === 'today'
			? t('Closed · opens at {{time}}', { time: status.time })
			: status.day === 'tomorrow'
			? t('Closed · opens tomorrow at {{time}}', { time: status.time })
			: status.day
			? t('Closed · opens {{day}} at {{time}}', { day: t(WEEK_DAY_LABEL[status.day]), time: status.time })
			: t('Closed');

	return (
		<span className={`pb-open pb-open--${status.state}`}>
			<i aria-hidden="true" />
			{text}
		</span>
	);
};

export default OpenStatus;
