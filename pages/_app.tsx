import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import moment from 'moment';
import 'moment/locale/ko';
import 'moment/locale/uz-latn';
import { light } from '../scss/MaterialTheme';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import '../scss/app.scss';
import '../scss/pb/index.scss';
import { NavProgress, ServerLoader } from '../libs/components/ui/Loaders';

// dates (moment and react-moment) follow the page language
const MOMENT_LOCALE: Record<string, string> = { en: 'en', kr: 'ko', uz: 'uz-latn' };

const App = ({ Component, pageProps }: AppProps) => {
	const { locale } = useRouter();
	// set during render so the server HTML and the first client render use the same language
	moment.locale(MOMENT_LOCALE[locale ?? 'en'] ?? 'en');
	// @ts-ignore
	const [theme, setTheme] = useState(createTheme(light));
	const client = useApollo(pageProps.initialApolloState);

	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<NavProgress />
				<ServerLoader />
				<Component {...pageProps} />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
