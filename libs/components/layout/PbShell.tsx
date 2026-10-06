import React from 'react';
import Head from 'next/head';
import PbHeader from './PbHeader';
import PbFooter from './PbFooter';
import Chat from '../Chat';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface PbShellProps {
	children: React.ReactNode;
	// pages not redesigned yet keep their old #pc-wrap styles
	legacy?: boolean;
}

const PbShell = ({ children, legacy = false }: PbShellProps) => (
	<>
		<Head>
			<title>PulseBridge</title>
			<meta name={'title'} content={`PulseBridge`} />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
		</Head>
		<div className="pb-app">
			<PbHeader />
			<main className="pb-main">
				{legacy ? (
					<div id="pc-wrap">
						<div id="main" style={{ paddingTop: 24 }}>
							{children}
						</div>
					</div>
				) : (
					children
				)}
			</main>
			<Chat />
			<PbFooter />
		</div>
	</>
);

// Soft Care layout for redesigned pages
export const withPbLayout = (Component: any) => {
	const Wrapped = (props: any) => (
		<PbShell>
			<Component {...props} />
		</PbShell>
	);
	return Wrapped;
};

export default PbShell;
