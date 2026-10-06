import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				<meta name="robots" content="index,follow" />
				<link rel="icon" type="image/png" href="/img/logo/favicon.svg" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&display=swap"
				/>

				{/* SEO */}
				<meta name="keyword" content={'pulsebridge, clinic, doctor, appointment, health'} />
				<meta
					name={'description'}
					content={
						'Find clinics and doctors and book appointments online on PulseBridge | ' +
						'Находите клиники и врачей и записывайтесь на приём онлайн в PulseBridge | ' +
						'PulseBridge에서 병원과 의사를 찾고 온라인으로 진료를 예약하세요'
					}
				/>
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
