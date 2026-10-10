import React from 'react';
import { useTranslation } from 'next-i18next';

// total next to an admin page title: "24 members" (noun keys: member / members, doctor / doctors ...)
const AdminTotal = ({ total, noun }: { total: number; noun: string }) => {
	const { t } = useTranslation('common');
	return (
		<span className="pb-admin-total">
			{total} {t(total === 1 ? noun : `${noun}s`)}
		</span>
	);
};

export default AdminTotal;
