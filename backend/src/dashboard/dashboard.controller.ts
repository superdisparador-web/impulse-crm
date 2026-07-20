import { Controller, Get } from '@nestjs/common';

@Controller('dashboard')
export class DashboardController {
  @Get()
  getDashboard() {
    return {
      whatsapps: 0,
      contacts: 0,
      campaigns: 0,
      today: 0,
    };
  }
}