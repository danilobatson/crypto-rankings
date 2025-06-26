import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from '@/lib/providers';

export const metadata: Metadata = {
	title: 'Crypto Rankings - Real-time Social Sentiment',
	description:
		'Track cryptocurrency rankings with real-time social sentiment data from LunarCrush MCP',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className={`antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
