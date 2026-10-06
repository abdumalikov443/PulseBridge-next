import React, { ReactNode } from 'react';
import Moment from 'react-moment';

export type Tone = 'soft' | 'success' | 'warning' | 'danger';

interface ListRowProps {
	avatar: ReactNode;
	title: string;
	subTitle?: string;
	extra?: ReactNode;
	date?: Date | string;
	// already formatted date (e.g. appointment day stored at UTC midnight)
	dateText?: string;
	dateFormat?: string;
	status?: string;
	tone?: Tone;
	count?: ReactNode;
	actions?: ReactNode;
	onClick?: () => void;
}

// one row of the My Page lists (appointments, clinic doctors, join requests)
const ListRow = (props: ListRowProps) => {
	const { avatar, title, subTitle, extra, date, dateText, dateFormat = 'MMM D, YYYY', status, tone = 'soft', count, actions, onClick } = props;

	return (
		<article className="pb-row">
			<button type="button" className="pb-row__main" onClick={onClick} disabled={!onClick}>
				{avatar}
				<span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
					<strong style={{ fontSize: 15 }}>{title}</strong>
					{subTitle && <span style={{ fontSize: 13, color: 'var(--pb-muted)' }}>{subTitle}</span>}
					{extra && <span style={{ fontSize: 13, color: 'var(--pb-ink)' }}>{extra}</span>}
				</span>
			</button>
			<div className="pb-row__meta">
				{(date || dateText) && (
					<span className="pb-row__cell">
						{dateText ?? <Moment format={dateFormat}>{date}</Moment>}
						{count !== undefined && <span style={{ color: 'var(--pb-muted)' }}> · {count}</span>}
					</span>
				)}
				{status && <span className={`pb-badge pb-badge--${tone}`}>{status}</span>}
				{actions && <div className="pb-row__actions">{actions}</div>}
			</div>
		</article>
	);
};

export default ListRow;
