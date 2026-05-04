/**
 * Service Layer Index
 * Export all services for easy import
 */

export { authService, AuthService } from './auth.service';
export { userService } from './user.service';
export { financeService } from './finance.service';
export { ticketService } from './ticket.service';
export { residentService } from './resident.service';
export { siteService } from './site.service';
export { announcementService } from './announcement.service';
export { apartmentService, ApartmentService } from './apartment.service';
export { blockService, BlockService } from './block.service';
export { communicationService } from './communication.service';
export { operationsService } from './operations.service';
export { governanceService } from './governance.service';
export { dashboardService } from './dashboard.service';
export { staffShiftService, StaffShiftService } from './staff-shift.service';
export { attachmentService, AttachmentService } from './attachment.service';
export { taskService } from './task.service';
export { visitorService, VisitorService } from './visitor.service';
export { meetingService, MeetingService } from './meeting.service';
export { votingService } from './voting.service';
export { maintenanceService } from './maintenance.service';

// Re-export API client
export { apiClient } from '../api/apiClient';
export * from '../types';
