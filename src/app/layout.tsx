import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import SupabaseProvider from "@/providers/SupabaseProvider";
import UserProvider from "@/providers/UserProvider";
import QueryProvider from "@/providers/QueryProvider";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from "@/components/ui/toaster"

const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "AeroSchedulePro",
	description: "Aircraft scheduling and management system",
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={font.className}>
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange>
					<QueryProvider>
						<SupabaseProvider>
							<UserProvider>{children}</UserProvider>
						</SupabaseProvider>
					</QueryProvider>
					<SpeedInsights />
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
