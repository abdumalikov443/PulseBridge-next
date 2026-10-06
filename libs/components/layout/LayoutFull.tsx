import React from 'react';
import PbShell from './PbShell';

// old pages keep their #pc-wrap styles inside the new Soft Care header and footer until they are redesigned
const withLayoutFull = (Component: any) => {
	const Wrapped = (props: any) => (
		<PbShell legacy>
			<Component {...props} />
		</PbShell>
	);
	return Wrapped;
};

export default withLayoutFull;
