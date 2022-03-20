import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'botbuilder';
import { AppService } from './app.service';
import { BotService } from './bot/bot.service';

@Controller("api")
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly botService: BotService
    ) {}

  @Post("messages")
  async botMessages(@Req() req: Request, @Res() res: Response) {
     await this.botService.process(req,res);
  }
}
