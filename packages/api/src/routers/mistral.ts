import { z } from "zod";
import { publicProcedure, router } from "../index";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

const DEFAULT_APPRECIATION = 
`Un trimestre avec des résultats hétérogènes pour Adam. Vous produisez un travail sérieux manquant de régularité dans certaines disciplines. Vous avez montré une belle implication en classe soulignée par plusieurs professeurs, il faut maintenant l'étendre à toutes les disciplines. Allez Adam !
Un deuxième trimestre dans la continuité du premier au niveau des résultats. La participation est active et Louis est davantage impliqué en classe. Cependant, des efforts sont toujours attendus quant à votre concentration et attitude qui se montrent trop fluctuantes. Le travail personnel est sérieux, mais se doit de gagner en rigueur afin de progresser.
Un deuxième trimestre avec des résultats satisfaisants. La participation de Gabriel en classe est appréciée, mais est, dans certaines disciplines, effacée par un comportement qui n'est pas toujours au travail. Le travail fourni est satisfaisant. Pour autant, nous sommes convaincus que vous avez encore la capacité de progresser en approfondissant le travail personnel.
Manon est une élève très investie, qui travaille avec l'envie de bien faire. Elle rencontre des difficultés dans certaines matières, notamment dans la restitution des connaissances. Un approfondissement des leçons semble indispensable pour lui permettre de progresser et consolider durablement ses acquis. Nous l'encourageons à croire davantage en ses capacités. L'erreur n'est pas un échec.
Excellents résultats pour ce premier trimestre. Gaspard s'implique avec sérieux et rigueur dans son travail. Nous l'encourageons à continuer sur cette voie, et à s'exprimer davantage à l'oral au second trimestre.
Un excellent trimestre qui clôture une année de cinquième réussie ! Bravo, Mathis, pour votre travail et votre investissement en classe. Poursuivez ainsi !
Adam a des capacités de travail qu'il pourrait mieux exploiter par une plus grande concentration en cours et une rigueur plus soutenue à l'écrit. Nous attendons des efforts en ce sens au prochain trimestre.
Bravo pour cet excellent trimestre, Héloïse. Vos capacités sont parfaitement mises en valeur par un travail sérieux et un investissement régulier en classe. Félicitations ! Poursuivez ainsi !
Un ensemble irrégulier malgré de belles réussites. Si dans certaines matières les professeurs louent votre travail et votre investissement, dans d'autres disciplines vos enseignants vous demandent de refaire les exercices, revoir les cours et vous montrer bien concentré. Suivez bien ces conseils pour progresser Maximilien c'est indispensable pour la prochaine période
Très bons résultats. Kenzo est un élève vif et pertinent mais il doit apprendre à canaliser ses prises de parole: cela sera bénéfique pour lui comme pour ses camarades. Nous comptons sur ses efforts.
Ensemble tout à fait satisfaisant. Carla travaille avec sérieux mais peut encore progresser en généralisant les efforts de participation à toutes les matières. Nous comptons sur elle pour tenir compte de ces conseils.
Un premier trimestre encourageant.La maîtrise des connaissances et des compétences est très satisfaisante. Lucas doit montrer son implication en restant concentré. Nous l'encourageons dans cette voie.
Très bonne entrée en classe de 6ème pour Ombline. Le niveau d'ensemble témoigne d'un investissement sérieux et réfléchi. Nous vous invitons à tenir compte des remarques de vos professeurs qui vous conseillent de participer davantage à l'oral. Vos connaissances sont solides, osez donc les partager avec l'ensemble de la classe pour continuer à gagner en confiance.
Un beau premier trimestre.La maîtrise des connaissances et des compétences est très satisfaisante. Martin s'investit avec sérieux et doit poursuivre ainsi tout en s'affirmant plus régulièrement à l'oral.`;

const DEFAULT_PROMPT = "Rédige une appréciation globale encourageante et précise, avec un ton neutre et un vocabulaire accessible.";

// Narrow typing for fetch responses so we don't depend on the global `Response`
// type, which can differ between environments (e.g. local vs Vercel build).
type FetchResponse = {
	ok: boolean;
	status: number;
	text(): Promise<string>;
	json(): Promise<unknown>;
};

const subjectAppreciationSchema = z.object({
	subjectName: z.string(),
	teachers: z.string(),
	appreciation: z.string(),
});

const generateAppreciationInputSchema = z.object({
	prompt: z.string(),
	subjects: z.array(subjectAppreciationSchema),
	studentFirstName: z.string(),
	studentGender: z.enum(["M", "F"]),
	userAppreciations: z.string().optional(),
});

type NameTransformer = {
	anonymize: (value: string) => string;
	deanonymize: (value: string) => string;
};

function createNameTransformer(
	studentFirstName: string,
	placeholderName: string
): NameTransformer {
	const trimmedStudentName = studentFirstName.trim();

	if (!trimmedStudentName) {
		return {
			anonymize: (value: string) => value,
			deanonymize: (value: string) => value
		};
	}

	const studentPattern = new RegExp(escapeRegExp(trimmedStudentName), "gi");
	const placeholderPattern = new RegExp(escapeRegExp(placeholderName), "gi");

	return {
		anonymize: (value: string) =>
			replaceWithMatchedCase(value, studentPattern, placeholderName),
		deanonymize: (value: string) =>
			replaceWithMatchedCase(value, placeholderPattern, trimmedStudentName)
	};
}

function replaceWithMatchedCase(
	value: string,
	pattern: RegExp,
	replacement: string
) {
	if (!value) {
		return value;
	}

	pattern.lastIndex = 0;
	return value.replace(pattern, (match) =>
		applyCasePattern(match, replacement)
	);
}

function applyCasePattern(source: string, target: string) {
	if (!source) {
		return target;
	}

	const isUpperCase = source === source.toUpperCase();
	const isLowerCase = source === source.toLowerCase();
	const isCapitalized =
		source.length > 0 &&
		source[0] === source[0]!.toUpperCase() &&
		source.slice(1) === source.slice(1).toLowerCase();

	if (isUpperCase) {
		return target.toUpperCase();
	}

	if (isLowerCase) {
		return target.toLowerCase();
	}

	if (isCapitalized) {
		return target.charAt(0).toUpperCase() + target.slice(1).toLowerCase();
	}

	return target;
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeAppreciation(raw: string) {
	return raw.replace(/\*\*/g, "").trim();
}

function truncateToMaxLength(text: string, maxLength: number = 400): string {
	if (text.length <= maxLength) {
		return text;
	}

	const ellipsis = "...";
	const maxLengthWithEllipsis = maxLength - ellipsis.length;

	// Try to cut at the last sentence before maxLength
	const truncated = text.slice(0, maxLengthWithEllipsis);
	const lastSentenceEnd = Math.max(
		truncated.lastIndexOf("."),
		truncated.lastIndexOf("!"),
		truncated.lastIndexOf("?")
	);

	// If we found a sentence end within the last 50 characters, cut there
	if (lastSentenceEnd > maxLengthWithEllipsis - 50 && lastSentenceEnd > 0) {
		return text.slice(0, lastSentenceEnd + 1).trim();
	}

	// Otherwise, cut at the last space before maxLength to avoid cutting words
	const lastSpace = truncated.lastIndexOf(" ");
	if (lastSpace > maxLengthWithEllipsis - 30 && lastSpace > 0) {
		return text.slice(0, lastSpace).trim() + ellipsis;
	}

	// Last resort: cut at maxLength and add ellipsis
	return truncated.trim() + ellipsis;
}

function buildUserPrompt(prompt: string, subjects: z.infer<typeof subjectAppreciationSchema>[], userAppreciations?: string) {
	const instruction = prompt?.trim()
		? prompt.trim()
		: DEFAULT_PROMPT;

	const subjectsSummary = subjects
		.map((subject) => {
			const lines = [
				`- Matière: ${subject.subjectName}`,
				subject.teachers ? `  Enseignant(s): ${subject.teachers}` : null,
				subject.appreciation
					? `  Appréciation: ${subject.appreciation}`
					: "  Appréciation: (vide)"
			].filter(Boolean);
			return lines.join("\n");
		})
		.join("\n");

	const styleExamples = userAppreciations?.trim() || DEFAULT_APPRECIATION;

	return `Consigne: ${instruction}

Contraintes de sortie:
- Le texte doit être une seule appréciation générale (1 à 3 phrases assez courtes en maximum 300 caractères).
- Aucune phrase introductive ou conclusion de type "Voici..." ou "En résumé".
- Pas de mise en forme Markdown ni de caractères gras (**).
- Réponds uniquement avec l'appréciation finale, rien d'autre.

Voici les appréciations matières existantes pour l'élève :
${subjectsSummary}

Inspires toi des appréciations suivantes pour le style :
${styleExamples}

Rédige l'appréciation conforme aux contraintes.`;
}

export const mistralRouter = router({
	generateAppreciation: publicProcedure
		.input(generateAppreciationInputSchema)
		.mutation(async ({ input }) => {
			const apiKey = process.env.MISTRAL_API_KEY;

			if (!apiKey) {
				throw new Error(
					"La clé MISTRAL_API_KEY est manquante dans les variables d'environnement."
				);
			}

			if (!input.subjects.length) {
				throw new Error(
					"Impossible de générer l'appréciation sans données de matières."
				);
			}

			const placeholderName = input.studentGender === "F" ? "Marie" : "Pierre";
			const nameTransformer = createNameTransformer(
				input.studentFirstName,
				placeholderName
			);
			const sanitizedPrompt = nameTransformer.anonymize(input.prompt ?? "");
			const sanitizedSubjects = input.subjects.map((subject) => ({
				...subject,
				appreciation: nameTransformer.anonymize(subject.appreciation)
			}));

			const messages = [
				{
					role: "system",
					content:
						"Tu es un professeur principal français. Tu rédiges des appréciations globales synthétiques en te basant sur les appréciations matières existantes."
				},
				{
					role: "user",
					content: buildUserPrompt(sanitizedPrompt, sanitizedSubjects, input.userAppreciations)
				}
			];

			const response = (await fetch(MISTRAL_API_URL, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					model: "mistral-large-latest",
					messages,
					temperature: 0.4,
					max_tokens: 300
				})
			})) as FetchResponse;

			if (!response.ok) {
				const details = await response.text();
				throw new Error(
					`Échec de la génération de l'appréciation (code ${response.status}): ${details}`
				);
			}

			const data = await response.json() as {
				choices?: Array<{
					message?: {
						content?: string;
					};
				}>;
			};
			const content = data?.choices?.[0]?.message?.content;

			if (!content) {
				throw new Error(
					"La réponse de Mistral ne contient pas de contenu exploitable."
				);
			}
			
			const sanitized = nameTransformer.deanonymize(sanitizeAppreciation(content));
			return truncateToMaxLength(sanitized, 400);
		}),
});

