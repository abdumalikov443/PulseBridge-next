import React from 'react';

// total next to an admin page title: "24 members"
const AdminTotal = ({ total, noun }: { total: number; noun: string }) => (
	<span className="pb-admin-total">
		{total} {total === 1 ? noun : `${noun}s`}
	</span>
);

export default AdminTotal;
