import { ActivityHandler, BotState, StatePropertyAccessor, ConversationState, UserState } from "botbuilder"
import { Dialog, DialogState } from "botbuilder-dialogs";
import { ComplexDialog } from "./dialogs/complexDialog";
import { UserProfileDialog } from "./dialogs/userProfileDialog";

export class AppBot extends ActivityHandler  {

    private conversationState: BotState;
    private userState: BotState;
    private dialog: Dialog;
    private dialogState: StatePropertyAccessor<DialogState>;

    constructor(conversationState: BotState, userState: BotState, dialog: Dialog){
        super();

        this.conversationState = conversationState as ConversationState;
        this.userState = userState as UserState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMessage(async (context, next) => {
            console.log("OnMessage");
            await (this.dialog as ComplexDialog).run(context, this.dialogState);

            await next();
        })

        this.onMembersAdded(async (context, next) => {
            const welcomeText = 'Hello and welcome!';
            for (let cnt = 0; cnt < context.activity.membersAdded.length; ++cnt) { //send everyone except bot who is recipient
                if (context.activity.membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(welcomeText);
                }
            }
            await next();

        });

        this.onDialog(async (context,next) => { //run at the end after all handlers
            await this.conversationState.saveChanges(context,false);
            await this.userState.saveChanges(context,false);
            await next();
        });
    }

    async run(context){
        await super.run(context);
    }
}