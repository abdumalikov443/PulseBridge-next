// badge color of a member / article / clinic status in the admin lists
export const statusTone = (status?: string): 'success' | 'warning' | 'danger' | 'muted' => {
	switch (status) {
		case 'ACTIVE':
			return 'success';
		case 'PAUSE':
		case 'HOLD':
			return 'warning';
		case 'BLOCK':
			return 'danger';
		default:
			return 'muted';
	}
};
