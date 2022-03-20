import { Injectable } from "@nestjs/common";
import { AppBot } from "./bot.model";
import { UserProfileDialog } from "./dialogs/userProfileDialog";
import { 
    BotFrameworkAdapter,  
    InputHints, 
    Request, 
    Response,
    TurnContext,
    MemoryStorage,
    ConversationState,
    UserState,
} from "botbuilder";
import { ComplexDialog } from "./dialogs/complexDialog";

@Injectable()
export class BotService {

    appBot: AppBot;
    botAdapter: BotFrameworkAdapter;

    constructor(){
        const memoryStorage = new MemoryStorage();
        const conversationState = new ConversationState(memoryStorage);
        const userState = new UserState(memoryStorage);

        const dialog = new ComplexDialog(userState);
        this.appBot = new AppBot(conversationState, userState, dialog);

        this.botAdapter = new BotFrameworkAdapter();
        this.botAdapter.onTurnError = async (context,error) => {
            console.error(`\n [onTurnError] unhandled error: ${ error }`);
            await context.sendTraceActivity(
                'OnTurnError Trace',
                `${ error }`,
                'https://www.botframework.com/schemas/error',
                'TurnError'
            );
            let onTurnErrorMessage = 'The bot encountered an error or bug.';
            await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
            onTurnErrorMessage = 'To continue to run this bot, please fix the bot source code.';
            await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
        }
    }

    public async process(req: Request, res: Response){
        await this.botAdapter.processActivity(req,res,(context: TurnContext) =>  this.appBot.run(context));
    }   
}