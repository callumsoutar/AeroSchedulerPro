"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import {
	useSessionContext,
	useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Plane } from "lucide-react";

const SignIn = () => {
	const supabaseClient = useSupabaseClient();
	const { session } = useSessionContext();
	const router = useRouter();

	useEffect(() => {
		if (session) {
			router.push("/dashboard");
		}
	}, [session, router]);

	return (
		<div className="min-h-[100dvh] w-full bg-[#0F172A] p-4 flex items-center justify-center">
			<div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-[400px] border border-slate-700/50">
				<div className="mb-8 text-center">
					<div className="flex justify-center mb-2">
						<div className="rounded-full bg-[#7C3AED]/10 p-3">
							<Plane className="h-5 w-5 text-[#7C3AED]" />
						</div>
					</div>
					<h1 className="text-2xl font-semibold text-white mb-2">AeroManager</h1>
					<p className="text-slate-400 text-sm">
						Sign in to manage your aero club operations
					</p>
				</div>
				
				<div className="w-full">
					<Auth
						supabaseClient={supabaseClient}
						providers={["google"]}
						magicLink={true}
						appearance={{
							theme: ThemeSupa,
							variables: {
								default: {
									colors: {
										brand: "#7C3AED",
										brandAccent: "#6D28D9",
										inputBackground: "#0F172A",
										inputBorder: "rgb(51 65 85 / 0.5)",
										inputText: "white",
										inputPlaceholder: "rgb(148 163 184)",
									},
									space: {
										inputPadding: "0.75rem 1rem 0.75rem 2.5rem",
									},
									borderWidths: {
										buttonBorderWidth: "0px",
										inputBorderWidth: "1px",
									},
									radii: {
										borderRadiusButton: "0.5rem",
										buttonBorderRadius: "0.5rem",
										inputBorderRadius: "0.5rem",
									},
								},
							},
							className: {
								container: "w-full",
								button: "h-11 font-medium hover:bg-[#6D28D9] transition-colors",
								input: "h-11 focus:border-[#7C3AED] focus:ring-[#7C3AED] focus:ring-opacity-25",
								label: "text-sm text-slate-300",
								anchor: "text-[#7C3AED] hover:text-[#6D28D9]",
							},
						}}
						theme="dark"
					/>
				</div>
			</div>
		</div>
	);
};

export default SignIn;
