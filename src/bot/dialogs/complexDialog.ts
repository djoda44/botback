import { ComponentDialog, WaterfallDialog, WaterfallStepContext, DialogState, DialogSet, DialogTurnStatus, DialogContext } from "botbuilder-dialogs";
import { BotState, UserState, StatePropertyAccessor, TurnContext, InputHints } from "botbuilder";
import { TopLevelDialog, TOP_LEVEL_DIALOG } from "./topLevelDialog";
import { UserProfileDialog } from "./userProfileDialog";

const MAIN_DIALOG = 'MAIN_DIALOG';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const USER_PROFILE_PROPERTY = 'USER_PROFILE_PROPERTY';

export class ComplexDialog extends ComponentDialog {

    userState: BotState;
    userProfileAccessor: StatePropertyAccessor<DialogState>;

    constructor(userState: BotState){
        super(MAIN_DIALOG);

        this.userState = userState as UserState;
        this.userProfileAccessor = userState.createProperty(USER_PROFILE_PROPERTY);

        this.addDialog(new TopLevelDialog());
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.initialStep.bind(this),
            this.finalStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async initialStep(stepContext: WaterfallStepContext) {
        return await stepContext.beginDialog(TOP_LEVEL_DIALOG);
    }

    async finalStep(stepContext: WaterfallStepContext<UserProfileDialog>) {
        const userInfo = stepContext.result;

        const status = 'You are signed up to review ' +
            (userInfo.companiesToReview.length === 0 ? 'no companies' : userInfo.companiesToReview.join(' and ')) + '.';
        await stepContext.context.sendActivity(status);
        await this.userProfileAccessor.set(stepContext.context, userInfo);
        return await stepContext.endDialog();
    }

    async run(turnContext: TurnContext, accessor: StatePropertyAccessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async onContinueDialog(innerDc) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }
        return await super.onContinueDialog(innerDc);
    }

    async interrupt(innerDc: DialogContext) {
        if (innerDc.context.activity.text) {
            const text = innerDc.context.activity.text.toLowerCase();

            switch (text) {
            case 'help':
            case '?': {
                const helpMessageText = 'Show help here';
                await innerDc.context.sendActivity(helpMessageText, helpMessageText, InputHints.ExpectingInput);
                return { status: DialogTurnStatus.waiting };
            }
            case 'cancel':
            case 'quit': {
                const cancelMessageText = 'Cancelling...';
                await innerDc.context.sendActivity(cancelMessageText, cancelMessageText, InputHints.IgnoringInput);
                return await innerDc.cancelAllDialogs();
            }
            }
        }
    }
}