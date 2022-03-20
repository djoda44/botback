import { ChoiceFactory, ChoicePrompt, ComponentDialog, ConfirmPrompt, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog, WaterfallStepContext } from "botbuilder-dialogs";
import { UserState, StatePropertyAccessor, TurnContext } from "botbuilder";
import { UserProfile } from "./userProfile.model";

const USER_PROFILE  = "USER_PROFILE";
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const NAME_PROMPT = "NAME_PROMPT";
const CONFIRM_PROMPT = 'CONFIRM_PROMPT';
const AGE_PROMPT = "AGE_PROMPT";
const WATERFALL_DIALOG = "WATERFALL_DIALOG";

export class UserProfileDialog extends ComponentDialog {

    userProfile: StatePropertyAccessor<UserProfile>;

    constructor(userState: UserState){
        super("userProfileDialog");

        this.userProfile = userState.createProperty(USER_PROFILE);

        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));
        this.addDialog(new ConfirmPrompt(CONFIRM_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG,[
            this.transportStep.bind(this),
            this.nameStep.bind(this),
            this.nameConfirmStep.bind(this),
            this.summaryStep.bind(this)
        ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    public async run(turnContext: TurnContext, accessor: StatePropertyAccessor){ //custom method
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if(results.status === DialogTurnStatus.empty){
            await dialogContext.beginDialog(this.id);
        }
    }

    async transportStep(stepContext: WaterfallStepContext){
        return await stepContext.prompt(CHOICE_PROMPT,{
            choices: ChoiceFactory.toChoices(['Car', 'Bus', 'Bicycle']),
            prompt: "Enter your transport"
        });
    }

    async nameStep(stepContext: WaterfallStepContext<UserProfile>){
        stepContext.options.transport = stepContext.result.value;
        stepContext.values["transport"] = stepContext.result.value;
        return await stepContext.prompt(NAME_PROMPT, "What is your name");

    }

    private async nameConfirmStep(stepContext: WaterfallStepContext<UserProfile>) {
        stepContext.options.name = stepContext.result;
        stepContext.values["name"] = stepContext.result;

        await stepContext.context.sendActivity(`Thanks ${stepContext.result}.`);

        return await stepContext.prompt(CONFIRM_PROMPT, 'Do you want to give your age?', ['yes', 'no']);
    }

    private async summaryStep(stepContext: WaterfallStepContext<UserProfile>){
        if(stepContext.result){
            const userProfile = await this.userProfile.get(stepContext.context, new UserProfile());
            const stepContextOption = stepContext.options;

            userProfile.transport = stepContextOption.transport;
            userProfile.name = stepContextOption.name;

            let msg = `I have your mode of transport as ${userProfile.transport} and your name as ${userProfile.name}.`;

            await stepContext.context.sendActivity(msg);
        }else{
            await stepContext.context.sendActivity('Thanks. Your profile will not be kept.');
        }
        return await stepContext.endDialog();
    }
}