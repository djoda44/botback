import { ComponentDialog, NumberPrompt, TextPrompt, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { ReviewDialog, REVIEW_SELECTION_DIALOG } from "./reviewDialog";
import { UserProfile } from "./userProfile.model";

export const TOP_LEVEL_DIALOG = 'TOP_LEVEL_DIALOG';

const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';
const NUMBER_PROMPT = 'NUMBER_PROMPT';

export class TopLevelDialog extends ComponentDialog {
    constructor(){
        super(TOP_LEVEL_DIALOG);

        this.addDialog(new TextPrompt(TEXT_PROMPT));
        this.addDialog(new NumberPrompt(NUMBER_PROMPT));

        this.addDialog(new ReviewDialog());

        
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.ageStep.bind(this),
            this.startSelectionStep.bind(this),
            this.acknowledgementStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async nameStep(stepContext: WaterfallStepContext) {
        stepContext.values["userInfo"] = new UserProfile();

        const promptOptions = { prompt: 'Please enter your name.' };

        return await stepContext.prompt(TEXT_PROMPT, promptOptions);
    }

    async ageStep(stepContext: WaterfallStepContext<UserProfile>) {
        stepContext.values["userInfo"].name = stepContext.result;

        const promptOptions = { prompt: 'Please enter your age.' };

        return await stepContext.prompt(NUMBER_PROMPT, promptOptions);
    }

    async startSelectionStep(stepContext: WaterfallStepContext<UserProfile>) {
        stepContext.values["userInfo"].age = stepContext.result;

        if (stepContext.result < 25) {
            await stepContext.context.sendActivity('You must be 25 or older to participate.');

            return await stepContext.next();
        } else {
            return await stepContext.beginDialog(REVIEW_SELECTION_DIALOG);
        }
    }

    async acknowledgementStep(stepContext: WaterfallStepContext<UserProfile>) {
        const userProfile = stepContext.values["userInfo"];
        userProfile.companiesToReview = stepContext.result || [];

        await stepContext.context.sendActivity(`Thanks for participating ${ userProfile.name }`);

        // Exit the dialog, returning the collected user information.
        return await stepContext.endDialog(userProfile);
    }
}