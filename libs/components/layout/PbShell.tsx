import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import PbHeader from './PbHeader';
import PbFooter from './PbFooter';
import Chat from '../Chat';

interface PbShellProps {
	children: React.ReactNode;
}

// browser tab titles: "Doctors · PulseBridge"
const pageTitles: Record<string, string> = {
	'/': 'Find a doctor near you',
	'/doctor': 'Doctors',
	'/doctor/detail': 'Doctor',
	'/clinic': 'Clinics',
	'/clinic/detail': 'Clinic',
	'/booking': 'Book an appointment',
	'/community': 'Community',
	'/community/detail': 'Community',
	'/mypage': 'My Page',
	'/member': 'Member',
	'/cs': 'Help center',
	'/about': 'About',
	'/account/join': 'Login or sign up',
};

const PbShell = ({ children }: PbShellProps) => {
	const router = useRouter();
	const page = pageTitles[router.pathname];
	const title = page ? `${page} · PulseBridge` : 'PulseBridge';

	return (
		<>
			<Head>
				<title>{title}</title>
				<meta name={'title'} content={title} />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
			</Head>
			<div className="pb-app">
				<PbHeader />
				<main className="pb-main">{children}</main>
				<Chat />
				<PbFooter />
			</div>
		</>
	);
};

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
