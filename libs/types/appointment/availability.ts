import { WeekDay } from '../../enums/clinic.enum';

export interface TimeSlot {
	// "HH:mm" start of a 30-minute slot
	time: string;
	// false when a confirmed appointment already takes it
	available: boolean;
}

// one bookable day (tomorrow .. +5 days)
export interface DayAvailability {
	// "YYYY-MM-DD"
	date: string;
	dayOfWeek: WeekDay;
	// false on the clinic's days off (no slots)
	isOpen: boolean;
	slots: TimeSlot[];
}
