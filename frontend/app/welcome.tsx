import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Building2, MapPin, TrendingUp } from "lucide-react-native";
import { Screen } from "../components/Screen";
import { colors } from "../constants/colors";
import { usePreferences } from "../hooks/usePreferences";

const slides = [
	{
		icon: MapPin,
		title: "Report problems around you",
		text: "Capture an issue, add its location, and send it to the right municipal team.",
	},
	{
		icon: TrendingUp,
		title: "Track municipal progress",
		text: "Follow every stage from submission to approval and resolution.",
	},
	{
		icon: Building2,
		title: "Make your neighborhood better",
		text: "Support community issues and help your city prioritize what matters.",
	},
];

export default function WelcomeScreen() {
	const [slide, setSlide] = useState(0);
	const { language } = usePreferences();
	const current = slides[slide];
	const Icon = current.icon;
	return (
		<Screen>
			<View style={styles.content}>
				<View style={styles.brand}>
					<View style={styles.logo}>
						<Text style={styles.logoText}>F</Text>
					</View>
					<Text style={styles.brandText}>
						FixMyStreet{" "}
						<Text style={styles.pro}>PRO</Text>
					</Text>
				</View>
				<View style={styles.hero}>
					<View style={styles.cityGlow} />
					<View style={styles.cityCard}>
						<View style={styles.buildingSmall} />
						<View style={styles.buildingTall} />
						<View style={styles.buildingWide} />
						<View style={styles.pin}>
							<MapPin size={24} color="#FFF" fill="#FFF" />
						</View>
					</View>
				</View>
				<View style={styles.copy}>
					<View style={styles.slideIcon}>
						<Icon size={24} color={colors.accent} />
					</View>
					<Text style={styles.title}>
						{slide === 0
							? language === "sq"
								? "Së bashku, le të ndërtojmë"
								: "Together, let's build"
							: language === "sq"
							? ["Raporto problemet rreth nesh", "Ndjek progresin e komunës", "Bëje lagjen më të mirë"][slide - 1]
							: current.title}
					</Text>
					{slide === 0 && (
						<Text style={styles.titleAccent}>{language === "sq" ? "një qytet më të mirë." : "a better city."}</Text>
					)}
					<Text style={styles.subtitle}>
						{slide === 0
							? (language === "sq" ? "Një raport. Një komunitet. Ndikim real në qytetin tënd." : "One report. One community. Real impact across your city.")
							: (language === "sq" ? ["Kap një problem, shto vendndodhjen dhe dërgoje ekipit." , "Ndiq çdo fazë nga dorëzimi deri te zgjidhja.", "Përkrahu çështjet dhe ndihmo qytetin të përparojë."][slide - 1] : current.text)}
					</Text>
				</View>
				<View style={styles.dots}>
					{slides.map((_, index) => (
						<View
							key={index}
							style={[
								styles.dot,
								index === slide && styles.dotActive,
							]}
						/>
					))}
				</View>
				{slide < 2 ? (
					<Pressable
						style={styles.button}
						onPress={() => setSlide(slide + 1)}
					>
						<Text style={styles.buttonText}>{language === "sq" ? "Vazhdo" : "Continue"}</Text>
					</Pressable>
				) : (
					<Pressable
						style={styles.button}
						onPress={() => router.replace("/login")}
					>
						<Text style={styles.buttonText}>{language === "sq" ? "Fillo" : "Get Started"}</Text>
					</Pressable>
				)}
				<Pressable
					style={styles.login}
					onPress={() => router.replace("/login")}
				>
					<Text style={styles.loginText}>{language === "sq" ? "Kam tashmë një llogari" : "I already have an account"}</Text>
				</Pressable>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 24,
		paddingBottom: 18,
	},
	brand: {
		height: 78,
		flexDirection: "row",
		alignItems: "center",
		gap: 9,
	},
	logo: {
		width: 38,
		height: 38,
		borderRadius: 12,
		backgroundColor: colors.accent,
		alignItems: "center",
		justifyContent: "center",
	},
	logoText: {
		color: "#FFF",
		fontSize: 22,
		fontWeight: "900",
	},
	brandText: {
		color: colors.navy,
		fontSize: 17,
		fontWeight: "900",
	},
	pro: {
		color: colors.accent,
		fontSize: 11,
	},
	hero: {
		height: Dimensions.get("window").height * 0.31,
		minHeight: 220,
		alignItems: "center",
		justifyContent: "center",
	},
	cityGlow: {
		position: "absolute",
		width: 230,
		height: 180,
		borderRadius: 115,
		backgroundColor: "#DCE8FF",
		opacity: 0.8,
	},
	cityCard: {
		width: 260,
		height: 190,
		borderRadius: 28,
		backgroundColor: "#FFFFFF",
		alignItems: "flex-end",
		justifyContent: "flex-end",
		flexDirection: "row",
		padding: 30,
		gap: 9,
		shadowColor: "#6D5DFC",
		shadowOpacity: 0.12,
		shadowRadius: 24,
		elevation: 6,
	},
	buildingSmall: {
		width: 44,
		height: 72,
		borderRadius: 8,
		backgroundColor: "#AFC9FF",
	},
	buildingTall: {
		width: 58,
		height: 112,
		borderRadius: 8,
		backgroundColor: "#6D5DFC",
	},
	buildingWide: {
		width: 82,
		height: 86,
		borderRadius: 8,
		backgroundColor: "#B9CFF9",
	},
	pin: {
		position: "absolute",
		right: 35,
		top: 28,
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: colors.danger,
		alignItems: "center",
		justifyContent: "center",
		transform: [{ rotate: "-8deg" }],
	},
	copy: {
		minHeight: 150,
	},
	slideIcon: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: colors.lightBlue,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	title: {
		color: colors.navy,
		fontSize: 30,
		lineHeight: 36,
		fontWeight: "900",
	},
	titleAccent: {
		color: colors.accent,
		fontSize: 30,
		lineHeight: 36,
		fontWeight: "900",
	},
	subtitle: {
		color: colors.muted,
		fontSize: 14,
		lineHeight: 21,
		marginTop: 8,
	},
	dots: {
		flexDirection: "row",
		gap: 6,
		height: 24,
		alignItems: "center",
	},
	dot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		backgroundColor: "#CCD5E5",
	},
	dotActive: {
		width: 22,
		backgroundColor: colors.accent,
	},
	button: {
		height: 56,
		borderRadius: 16,
		backgroundColor: colors.accent,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: "#FFF",
		fontSize: 16,
		fontWeight: "800",
	},
	login: {
		height: 44,
		alignItems: "center",
		justifyContent: "center",
	},
	loginText: {
		color: colors.text,
		fontSize: 14,
		fontWeight: "700",
	},
});
