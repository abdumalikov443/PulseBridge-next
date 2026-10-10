import { WeekDay } from './enums/clinic.enum';
import { localeTag, tr } from './i18n';

// same rules as the backend schedule (libs/schedule.ts there): half hours, open < close, break inside, a working day

export const WEEK_DAYS: WeekDay[] = [
	WeekDay.MON,
	WeekDay.TUE,
	WeekDay.WED,
	WeekDay.THU,
	WeekDay.FRI,
	WeekDay.SAT,
	WeekDay.SUN,
];
export const WEEK_DAY_LABEL: Record<WeekDay, string> = {
	[WeekDay.MON]: 'Mon',
	[WeekDay.TUE]: 'Tue',
	[WeekDay.WED]: 'Wed',
	[WeekDay.THU]: 'Thu',
	[WeekDay.FRI]: 'Fri',
	[WeekDay.SAT]: 'Sat',
	[WeekDay.SUN]: 'Sun',
};

// 00:00 .. 23:30
export const HALF_HOURS = Array.from(
	{ length: 48 },
	(_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
);

export interface Schedule {
	clinicOpenTime: string;
	clinicCloseTime: string;
	clinicBreakStart?: string | null;
	clinicBreakEnd?: string | null;
	clinicOffDays: WeekDay[];
}

export const DEFAULT_SCHEDULE: Schedule = {
	clinicOpenTime: '09:00',
	clinicCloseTime: '18:00',
	clinicBreakStart: null,
	clinicBreakEnd: null,
	clinicOffDays: [],
};

// clinics saved before working hours existed have no schedule fields
export const withScheduleDefaults = (clinic?: Partial<Schedule> | null): Schedule => ({
	clinicOpenTime: clinic?.clinicOpenTime || DEFAULT_SCHEDULE.clinicOpenTime,
	clinicCloseTime: clinic?.clinicCloseTime || DEFAULT_SCHEDULE.clinicCloseTime,
	clinicBreakStart: clinic?.clinicBreakStart || null,
	clinicBreakEnd: clinic?.clinicBreakEnd || null,
	clinicOffDays: clinic?.clinicOffDays ?? [],
});

// null when valid, otherwise a message for the form
export const scheduleError = (s: Schedule): string | null => {
	if (s.clinicOpenTime >= s.clinicCloseTime) return 'Closing time must be after opening time.';
	if (!s.clinicBreakStart !== !s.clinicBreakEnd) return 'Set both break start and break end, or neither.';
	if (s.clinicBreakStart && s.clinicBreakEnd) {
		if (s.clinicBreakStart >= s.clinicBreakEnd) return 'Break end must be after break start.';
		if (s.clinicBreakStart < s.clinicOpenTime || s.clinicBreakEnd > s.clinicCloseTime)
			return 'The break must be inside working hours.';
	}
	if (s.clinicOffDays.length >= 7) return 'Keep at least one working day.';
	return null;
};

// "Mon–Fri" style ranges of the working days
export const workingDaysText = (offDays: WeekDay[] = []): string => {
	const open = WEEK_DAYS.map((day) => !offDays.includes(day));
	const parts: string[] = [];
	for (let i = 0; i < 7; i++) {
		if (!open[i]) continue;
		let j = i;
		while (j + 1 < 7 && open[j + 1]) j++;
		parts.push(
			j - i >= 2
				? `${tr(WEEK_DAY_LABEL[WEEK_DAYS[i]])}–${tr(WEEK_DAY_LABEL[WEEK_DAYS[j]])}`
				: WEEK_DAYS.slice(i, j + 1)
						.map((d) => tr(WEEK_DAY_LABEL[d]))
						.join(', '),
		);
		i = j;
	}
	return parts.join(', ');
};

// today in Seoul as "YYYY-MM-DD" (appointments use Seoul calendar days)
const seoulToday = (): string => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());

export const isTomorrow = (date: string): boolean =>
	date === new Date(new Date(`${seoulToday()}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);

// "Tomorrow" or "Wed, Oct 9" for a "YYYY-MM-DD" day, in the current language
export const dayLabel = (date: string): string => {
	if (isTomorrow(date)) return tr('Tomorrow');
	return new Date(`${date}T00:00:00Z`).toLocaleDateString(localeTag(), {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	});
};
