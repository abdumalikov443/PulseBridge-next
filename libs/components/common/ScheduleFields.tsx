import React from 'react';
import { WeekDay } from '../../enums/clinic.enum';
import { HALF_HOURS, Schedule, scheduleError, WEEK_DAYS, WEEK_DAY_LABEL } from '../../schedule';

interface ScheduleFieldsProps {
	value: Schedule;
	onChange: (value: Schedule) => void;
}

// clinic working hours: open / close, optional lunch break, days off (doctors are booked inside these hours)
const ScheduleFields = ({ value, onChange }: ScheduleFieldsProps) => {
	const hasBreak = !!(value.clinicBreakStart || value.clinicBreakEnd);
	const error = scheduleError(value);

	const timeSelect = (key: keyof Schedule, label: string) => (
		<label className="pb-field">
			<span>{label}</span>
			<select className="pb-select" value={(value[key] as string) ?? ''} onChange={(e) => onChange({ ...value, [key]: e.target.value })}>
				{HALF_HOURS.map((time) => (
					<option key={time} value={time}>
						{time}
					</option>
				))}
			</select>
		</label>
	);

	const toggleDay = (day: WeekDay) => {
		const off = value.clinicOffDays.includes(day);
		onChange({ ...value, clinicOffDays: off ? value.clinicOffDays.filter((d) => d !== day) : [...value.clinicOffDays, day] });
	};

	return (
		<fieldset className="pb-schedule">
			<legend>Working hours</legend>
			<div className="pb-form-grid">
				{timeSelect('clinicOpenTime', 'Opens')}
				{timeSelect('clinicCloseTime', 'Closes')}
			</div>

			<label className="pb-schedule__check">
				<input
					type="checkbox"
					checked={hasBreak}
					onChange={(e) =>
						onChange(e.target.checked ? { ...value, clinicBreakStart: '13:00', clinicBreakEnd: '14:00' } : { ...value, clinicBreakStart: null, clinicBreakEnd: null })
					}
				/>
				Lunch break
			</label>
			{hasBreak && (
				<div className="pb-form-grid">
					{timeSelect('clinicBreakStart', 'Break starts')}
					{timeSelect('clinicBreakEnd', 'Break ends')}
				</div>
			)}

			<div className="pb-field">
				<span>Working days (tap a day to close it)</span>
				<div className="pb-schedule__days" role="group" aria-label="Working days">
					{WEEK_DAYS.map((day) => {
						const open = !value.clinicOffDays.includes(day);
						return (
							<button key={day} type="button" aria-pressed={open} className={`pb-schedule__day ${open ? 'is-open' : ''}`} onClick={() => toggleDay(day)}>
								{WEEK_DAY_LABEL[day]}
							</button>
						);
					})}
				</div>
			</div>
			{error && (
				<p role="alert" className="pb-schedule__error">
					{error}
				</p>
			)}
		</fieldset>
	);
};

export default ScheduleFields;
